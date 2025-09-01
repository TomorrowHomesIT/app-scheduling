import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { IFolder } from '@/models/folder.model';
import type { IJob } from '@/models/job.model';
import { folders as mockFolders, jobs as mockJobs } from './mock-data';

interface AppStore {
  folders: IFolder[];
  jobs: IJob[];
  currentJob: IJob | null;
  
  loadFolders: () => Promise<void>;
  loadJob: (id: number) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
}

// Simulate API delay
const simulateApiDelay = () => new Promise(resolve => setTimeout(resolve, 300));

// Mock API functions
const fetchFoldersFromApi = async (): Promise<IFolder[]> => {
  await simulateApiDelay();
  return mockFolders;
};

const fetchJobByIdFromApi = async (id: number): Promise<IJob | null> => {
  await simulateApiDelay();
  return mockJobs.find(job => job.id === id) || null;
};

const useAppStore = create<AppStore>()(
  devtools((set, get) => ({
    folders: [],
    jobs: [],
    currentJob: null,
    
    loadFolders: async () => {
      const folders = await fetchFoldersFromApi();
      set({ folders });
    },

    loadJob: async (id: number) => {
      const job = await fetchJobByIdFromApi(id);
      if (job) {
        set((state) => {
          // Update or add job to jobs array
          const jobIndex = state.jobs.findIndex(j => j.id === id);
          const updatedJobs = jobIndex !== -1 
            ? state.jobs.map(j => j.id === id ? job : j)
            : [...state.jobs, job];
          
          return {
            jobs: updatedJobs,
            currentJob: job
          };
        });
      }
    },

    setCurrentJob: (job: IJob | null) => {
      set({ currentJob: job });
    }
  }))
);

export default useAppStore;