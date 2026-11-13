import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Task,
  TeamMember,
  TaskCompletionRecord,
  ViewMode,
  UserAccount,
  UserStatus,
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_TASKS,
  INITIAL_USERS,
  generateInitialCompletions,
} from '../data/initialData';
import { formatDateKey, isTaskDueOnDate } from '../utils/dateUtils';
import { db, testFirestoreConnection } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';

interface TaskContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  tasks: Task[];
  members: TeamMember[];
  completions: Record<string, TaskCompletionRecord>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  toggleTaskCompletion: (taskId: string, date?: Date) => void;
  setTaskCompletion: (taskId: string, date: Date, completed: boolean) => void;
  markAllForDate: (date: Date, completed: boolean, memberIdFilter?: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  addMultipleTasks: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => Promise<number>;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addMember: (member: Omit<TeamMember, 'id'>) => TeamMember;
  resetToDemo: () => Promise<void>;
  getDueTasksForDate: (date: Date, memberIdFilter?: string) => Task[];
  isTaskCompleted: (taskId: string, date?: Date) => boolean;
  getTaskCompletion: (taskId: string, date?: Date) => TaskCompletionRecord | undefined;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  isBulkModalOpen: boolean;
  setIsBulkModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  isCloudSynced: boolean;
  // Auth methods
  login: (username: string, password: string) => { success: boolean; message?: string };
  signUp: (username: string, password: string, name: string, role: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserStatus: (userId: string, newStatus: UserStatus) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'taskflow_auth_session_user_v1';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [completions, setCompletions] = useState<Record<string, TaskCompletionRecord>>({});

  // Current logged in user session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse user session', e);
    }
    return null;
  });

  // When user logs in as regular team member, pin view to their assigned memberId
  useEffect(() => {
    if (currentUser) {
      if (!currentUser.isAdmin && currentUser.memberId) {
        setSelectedMemberId(currentUser.memberId);
      }
    }
  }, [currentUser]);

  // Real-time Cloud Synchronization with Firestore
  useEffect(() => {
    testFirestoreConnection();

    // 1. Listen for Users collection
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      async (snapshot) => {
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_USERS.forEach((u) => {
            batch.set(doc(db, 'users', u.id), u);
          });
          await batch.commit();
        } else {
          const loaded: UserAccount[] = [];
          snapshot.forEach((d) => loaded.push(d.data() as UserAccount));
          setUsers(loaded);

          // Update current user state if status changed
          if (currentUser) {
            const updatedSelf = loaded.find((u) => u.id === currentUser.id);
            if (updatedSelf) {
              setCurrentUser(updatedSelf);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSelf));
            }
          }
        }
      },
      (error) => {
        console.warn('Realtime users listener warning:', error);
      }
    );

    // 2. Listen for Tasks collection
    const unsubTasks = onSnapshot(
      collection(db, 'tasks'),
      async (snapshot) => {
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_TASKS.forEach((t) => {
            batch.set(doc(db, 'tasks', t.id), t);
          });
          await batch.commit();
        } else {
          const loaded: Task[] = [];
          snapshot.forEach((d) => loaded.push(d.data() as Task));
          setTasks(loaded);
          setIsCloudSynced(true);
        }
      },
      (error) => {
        console.warn('Realtime tasks listener warning:', error);
      }
    );

    // 3. Listen for Members collection
    const unsubMembers = onSnapshot(
      collection(db, 'members'),
      async (snapshot) => {
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_MEMBERS.forEach((m) => {
            batch.set(doc(db, 'members', m.id), m);
          });
          await batch.commit();
        } else {
          const loaded: TeamMember[] = [];
          snapshot.forEach((d) => loaded.push(d.data() as TeamMember));
          setMembers(loaded);
        }
      },
      (error) => {
        console.warn('Realtime members listener warning:', error);
      }
    );

    // 4. Listen for Completions collection
    const unsubCompletions = onSnapshot(
      collection(db, 'completions'),
      async (snapshot) => {
        if (snapshot.empty) {
          const initial = generateInitialCompletions(new Date());
          const batch = writeBatch(db);
          Object.entries(initial).forEach(([key, record]) => {
            batch.set(doc(db, 'completions', key), record);
          });
          await batch.commit();
        } else {
          const loaded: Record<string, TaskCompletionRecord> = {};
          snapshot.forEach((d) => {
            loaded[d.id] = d.data() as TaskCompletionRecord;
          });
          setCompletions(loaded);
        }
      },
      (error) => {
        console.warn('Realtime completions listener warning:', error);
      }
    );

    return () => {
      unsubUsers();
      unsubTasks();
      unsubMembers();
      unsubCompletions();
    };
  }, []);

  const login = (username: string, password: string): { success: boolean; message?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const found = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === password
    );

    if (!found) {
      return { success: false, message: 'Invalid username or password.' };
    }

    if (found.status === 'pending') {
      return {
        success: false,
        message: 'Your account is currently pending administrator approval. Please ask your manager or admin to approve your access.',
      };
    }

    if (found.status === 'rejected') {
      return {
        success: false,
        message: 'This account registration was rejected by the administrator.',
      };
    }

    setCurrentUser(found);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));

    // Default view routing
    if (found.isAdmin) {
      setViewMode('individual');
      setSelectedMemberId('all');
    } else {
      setViewMode('individual');
      setSelectedMemberId(found.memberId || 'all');
    }

    return { success: true };
  };

  const signUp = async (
    username: string,
    password: string,
    name: string,
    role: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password || !name) {
      return { success: false, message: 'All required fields must be filled.' };
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUser)) {
      return { success: false, message: `Username "${username}" is already taken.` };
    }

    // Auto-create matching TeamMember entry for roster
    const newMemberId = `member-${Date.now()}`;
    const initials = name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'TM';

    const colors = [
      { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    ];
    const assignedColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: TeamMember = {
      id: newMemberId,
      name: name.trim(),
      role: role.trim() || 'Team Member',
      email: `${cleanUser}@team.internal`,
      initials,
      color: assignedColor,
    };

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: cleanUser,
      password: password,
      name: name.trim(),
      role: role.trim() || 'Team Member',
      status: 'pending', // Requires admin approval
      isAdmin: false,
      memberId: newMemberId,
      createdAt: new Date().toISOString(),
    };

    // Save both member and pending user to Firestore
    try {
      await setDoc(doc(db, 'members', newMember.id), newMember);
      await setDoc(doc(db, 'users', newUser.id), newUser);
      return {
        success: true,
        message: 'Account created successfully! Your request is sent to the admin for approval.',
      };
    } catch (err) {
      console.error('Error signing up:', err);
      return { success: false, message: 'Failed to create user in database.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setViewMode('individual');
  };

  const updateUserStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      const user = users.find((u) => u.id === userId);
      if (user) {
        await setDoc(userRef, { ...user, status: newStatus }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const getCompletionKey = (taskId: string, date: Date) => {
    return `${formatDateKey(date)}_${taskId}`;
  };

  const isTaskCompleted = (taskId: string, date: Date = selectedDate): boolean => {
    const key = getCompletionKey(taskId, date);
    return Boolean(completions[key]?.completed);
  };

  const getTaskCompletion = (taskId: string, date: Date = selectedDate): TaskCompletionRecord | undefined => {
    const key = getCompletionKey(taskId, date);
    return completions[key];
  };

  const toggleTaskCompletion = async (taskId: string, date: Date = selectedDate) => {
    const dateKey = formatDateKey(date);
    const key = `${dateKey}_${taskId}`;
    const current = Boolean(completions[key]?.completed);
    const task = tasks.find((t) => t.id === taskId);

    // Optimistic local update
    setCompletions((prev) => {
      const next = { ...prev };
      if (current) {
        delete next[key];
      } else {
        next[key] = {
          taskId,
          date: dateKey,
          completed: true,
          completedAt: new Date().toISOString(),
          completedBy: currentUser ? currentUser.name : (task ? task.assigneeId : 'user'),
        };
      }
      return next;
    });

    try {
      if (current) {
        await deleteDoc(doc(db, 'completions', key));
      } else {
        await setDoc(doc(db, 'completions', key), {
          taskId,
          date: dateKey,
          completed: true,
          completedAt: new Date().toISOString(),
          completedBy: currentUser ? currentUser.name : (task ? task.assigneeId : 'user'),
        });
      }
    } catch (err) {
      console.error('Failed to sync completion to cloud:', err);
    }
  };

  const setTaskCompletion = async (taskId: string, date: Date, completed: boolean) => {
    const dateKey = formatDateKey(date);
    const key = `${dateKey}_${taskId}`;
    const task = tasks.find((t) => t.id === taskId);

    setCompletions((prev) => {
      const next = { ...prev };
      if (!completed) {
        delete next[key];
      } else {
        next[key] = {
          taskId,
          date: dateKey,
          completed: true,
          completedAt: new Date().toISOString(),
          completedBy: currentUser ? currentUser.name : (task ? task.assigneeId : 'user'),
        };
      }
      return next;
    });

    try {
      if (!completed) {
        await deleteDoc(doc(db, 'completions', key));
      } else {
        await setDoc(doc(db, 'completions', key), {
          taskId,
          date: dateKey,
          completed: true,
          completedAt: new Date().toISOString(),
          completedBy: currentUser ? currentUser.name : (task ? task.assigneeId : 'user'),
        });
      }
    } catch (err) {
      console.error('Failed to sync completion:', err);
    }
  };

  const getDueTasksForDate = (date: Date, memberIdFilter?: string): Task[] => {
    return tasks.filter((t) => {
      // If user is a regular team member (non-admin), enforce viewing ONLY their tasks
      if (currentUser && !currentUser.isAdmin) {
        return t.assigneeId === currentUser.memberId && isTaskDueOnDate(t, date);
      }

      // Admin or manager filter
      if (memberIdFilter && memberIdFilter !== 'all' && t.assigneeId !== memberIdFilter) {
        return false;
      }
      return isTaskDueOnDate(t, date);
    });
  };

  const markAllForDate = async (date: Date, completed: boolean, memberIdFilter?: string) => {
    const dueTasks = getDueTasksForDate(date, memberIdFilter);
    const dateKey = formatDateKey(date);
    const batch = writeBatch(db);

    setCompletions((prev) => {
      const next = { ...prev };
      dueTasks.forEach((t) => {
        const key = `${dateKey}_${t.id}`;
        if (completed) {
          next[key] = {
            taskId: t.id,
            date: dateKey,
            completed: true,
            completedAt: new Date().toISOString(),
            completedBy: currentUser ? currentUser.name : t.assigneeId,
          };
          batch.set(doc(db, 'completions', key), next[key]);
        } else {
          delete next[key];
          batch.delete(doc(db, 'completions', key));
        }
      });
      return next;
    });

    try {
      await batch.commit();
    } catch (err) {
      console.error('Failed to batch update completions:', err);
    }
  };

  const addTask = (taskInput: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskInput,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    setDoc(doc(db, 'tasks', newTask.id), newTask).catch((err) =>
      console.error('Failed to create task in cloud:', err)
    );

    return newTask;
  };

  const addMultipleTasks = async (tasksInput: Omit<Task, 'id' | 'createdAt'>[]): Promise<number> => {
    if (tasksInput.length === 0) return 0;

    const now = Date.now();
    const createdAt = new Date().toISOString();
    const newTasks: Task[] = tasksInput.map((taskInput, idx) => ({
      ...taskInput,
      id: `task-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt,
    }));

    setTasks((prev) => [...newTasks, ...prev]);

    try {
      // Firestore batches support up to 500 operations per batch
      const chunkSize = 450;
      for (let i = 0; i < newTasks.length; i += chunkSize) {
        const chunk = newTasks.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((t) => {
          batch.set(doc(db, 'tasks', t.id), t);
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Failed to batch create tasks in cloud:', err);
      throw err;
    }

    return newTasks.length;
  };

  const updateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setDoc(doc(db, 'tasks', updated.id), updated).catch((err) =>
      console.error('Failed to update task in cloud:', err)
    );
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.endsWith(`_${taskId}`)) {
          delete next[k];
        }
      });
      return next;
    });

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.error('Failed to delete task in cloud:', err);
    }
  };

  const addMember = (memberInput: Omit<TeamMember, 'id'>): TeamMember => {
    const newMember: TeamMember = {
      ...memberInput,
      id: `member-${Date.now()}`,
    };
    setMembers((prev) => [...prev, newMember]);
    setDoc(doc(db, 'members', newMember.id), newMember).catch((err) =>
      console.error('Failed to add member in cloud:', err)
    );
    return newMember;
  };

  const resetToDemo = async () => {
    try {
      // 1. Delete all existing docs in cloud
      const userDocs = await getDocs(collection(db, 'users'));
      const batch0 = writeBatch(db);
      userDocs.forEach((d) => batch0.delete(d.ref));
      await batch0.commit();

      const taskDocs = await getDocs(collection(db, 'tasks'));
      const batch1 = writeBatch(db);
      taskDocs.forEach((d) => batch1.delete(d.ref));
      await batch1.commit();

      const memberDocs = await getDocs(collection(db, 'members'));
      const batch2 = writeBatch(db);
      memberDocs.forEach((d) => batch2.delete(d.ref));
      await batch2.commit();

      const compDocs = await getDocs(collection(db, 'completions'));
      const batch3 = writeBatch(db);
      compDocs.forEach((d) => batch3.delete(d.ref));
      await batch3.commit();

      // 2. Re-seed default demo
      const seedBatch = writeBatch(db);
      INITIAL_USERS.forEach((u) => seedBatch.set(doc(db, 'users', u.id), u));
      INITIAL_TASKS.forEach((t) => seedBatch.set(doc(db, 'tasks', t.id), t));
      INITIAL_MEMBERS.forEach((m) => seedBatch.set(doc(db, 'members', m.id), m));
      const demoComps = generateInitialCompletions(new Date());
      Object.entries(demoComps).forEach(([k, rec]) => {
        seedBatch.set(doc(db, 'completions', k), rec);
      });
      await seedBatch.commit();

      setSelectedDate(new Date());
      setSelectedMemberId('all');
    } catch (err) {
      console.error('Failed to reset cloud database:', err);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        currentUser,
        users,
        tasks,
        members,
        completions,
        selectedDate,
        setSelectedDate,
        viewMode,
        setViewMode,
        selectedMemberId,
        setSelectedMemberId,
        toggleTaskCompletion,
        setTaskCompletion,
        markAllForDate,
        addTask,
        addMultipleTasks,
        updateTask,
        deleteTask,
        addMember,
        resetToDemo,
        getDueTasksForDate,
        isTaskCompleted,
        getTaskCompletion,
        isTaskModalOpen,
        setIsTaskModalOpen,
        isBulkModalOpen,
        setIsBulkModalOpen,
        editingTask,
        setEditingTask,
        isCloudSynced,
        login,
        signUp,
        logout,
        updateUserStatus,
        deleteUser,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
