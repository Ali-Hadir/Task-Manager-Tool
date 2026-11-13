import React from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { TopNav } from './components/TopNav';
import { DateBar } from './components/DateBar';
import { IndividualView } from './components/IndividualView';
import { TeamBoardView } from './components/TeamBoardView';
import { ReportsView } from './components/ReportsView';
import { TaskManagementView } from './components/TaskManagementView';
import { AdminUserManagementView } from './components/AdminUserManagementView';
import { AuthView } from './components/AuthView';
import { TaskModal } from './components/TaskModal';
import { BulkTaskUploadModal } from './components/BulkTaskUploadModal';

const MainAppContent: React.FC = () => {
  const { viewMode, currentUser } = useTasks();

  // If user is not authenticated, render the Sign In / Sign Up portal
  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Bar with 3-Zone Contract */}
      <TopNav />

      {/* Date Navigation & Daily Metric Bar (displayed on daily checklist & team views) */}
      {(viewMode === 'individual' || viewMode === 'team') && <DateBar />}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.isAdmin ? (
          <>
            {viewMode === 'individual' && <IndividualView />}
            {viewMode === 'team' && <TeamBoardView />}
            {viewMode === 'reports' && <ReportsView />}
            {viewMode === 'manage' && <TaskManagementView />}
            {viewMode === 'admin_users' && <AdminUserManagementView />}
          </>
        ) : (
          <>{viewMode === 'team' ? <TeamBoardView /> : <IndividualView />}</>
        )}
      </main>

      {/* Shared Task Creator & Recurrence Editor Modal */}
      <TaskModal />
      <BulkTaskUploadModal />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">TaskFlow</span>
            <span aria-hidden="true">·</span>
            <span>Minimalist Recurring Task & Team Verification Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Signed in as <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.isAdmin ? 'Admin' : 'Member'})</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <TaskProvider>
      <MainAppContent />
    </TaskProvider>
  );
}
