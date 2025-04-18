
// IndexedDB database setup for the Travel Request Management System

// Database schema version
const DB_VERSION = 1;
const DB_NAME = "TravelRequestDB";

// Database schema structure
const STORES = {
  users: { keyPath: "id", indexes: ["role", "department"] },
  requests: { keyPath: "request_id", indexes: ["current_status", "requester_id"] },
  approvals: { keyPath: "approval_id", indexes: ["request_id", "approver_id"] },
  ticketOptions: { keyPath: "option_id", indexes: ["request_id"] },
  auditLog: { keyPath: "log_id", indexes: ["request_id", "user_id"] }
};

// Open database connection
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Create object stores and indexes
      Object.entries(STORES).forEach(([storeName, { keyPath, indexes }]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath, autoIncrement: true });
          
          // Add indexes
          indexes.forEach(indexName => {
            store.createIndex(indexName, indexName, { unique: false });
          });
        }
      });
    };
  });
};

// Generic function to add an item to a store
export const addItem = async <T>(storeName: string, item: T): Promise<number> => {
  const db = await openDB();
  
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(new Error(`Failed to add item to ${storeName}`));
    };
  });
};

// Generic function to get all items from a store
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  
  return new Promise<T[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get items from ${storeName}`));
    };
  });
};

// Generic function to get an item by ID
export const getItemById = async <T>(storeName: string, id: number | string): Promise<T | null> => {
  const db = await openDB();
  
  return new Promise<T | null>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get item from ${storeName}`));
    };
  });
};

// Generic function to update an item
export const updateItem = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to update item in ${storeName}`));
    };
  });
};

// Generic function to delete an item
export const deleteItem = async (storeName: string, id: number | string): Promise<void> => {
  const db = await openDB();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete item from ${storeName}`));
    };
  });
};

// Function to query items by an index
export const queryByIndex = async <T>(
  storeName: string, 
  indexName: string, 
  value: string | number
): Promise<T[]> => {
  const db = await openDB();
  
  return new Promise<T[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      reject(new Error(`Failed to query items from ${storeName} by ${indexName}`));
    };
  });
};
