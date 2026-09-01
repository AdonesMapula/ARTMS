import api from "./api";

export const developerService = {
  /**
   * Fetch all database tables with real-time row counts and storage metrics
   */
  getTables: async () => {
    const res = await api.get("/developer/database/tables");
    return res.data;
  },

  /**
   * Truncate a single specific table
   */
  truncateTable: async (tableName) => {
    const res = await api.post("/developer/database/truncate", { table_name: tableName });
    return res.data;
  },

  /**
   * Purge all tables EXCEPT the specified excluded list
   */
  purgeExcept: async (excludedTables) => {
    const res = await api.post("/developer/database/purge-except", {
      excluded_tables: excludedTables,
    });
    return res.data;
  },

  /**
   * Execute a categorized preset purge
   */
  purgePreset: async (presetKey) => {
    const res = await api.post("/developer/database/purge-preset", {
      preset: presetKey,
    });
    return res.data;
  },

  /**
   * Fetch live table rows & schema structure
   */
  getTableData: async (tableName, params = {}) => {
    const res = await api.get("/developer/database/table-data", {
      params: { table_name: tableName, ...params },
    });
    return res.data;
  },

  /**
   * Truncate multiple specified tables
   */
  bulkTruncate: async (tableNames) => {
    const res = await api.post("/developer/database/bulk-truncate", {
      table_names: tableNames,
    });
    return res.data;
  },

  /**
   * Trigger an on-demand database reseed
   */
  reseed: async (seederName) => {
    const res = await api.post("/developer/database/reseed", {
      seeder: seederName,
    });
    return res.data;
  },
};

export default developerService;
