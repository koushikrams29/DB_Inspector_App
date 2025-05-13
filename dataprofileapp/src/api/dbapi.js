import axios from 'axios';
import { baseURL } from '../utilities/constants';

const BASE_URL = baseURL;

/**
 * Tests a database connection using the provided data.
 * @param {object} data - Connection details from the form (matches Pydantic TestConnectionRequest structure).
 * @returns {Promise<object>} - The response data from the API (matches Pydantic TestConnectionResponse).
 */
export const testConnection = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/connections/test`, {
            // The payload structure directly matches the TestConnectionRequest Pydantic model
            sql_flavor: data.sql_flavor,
            db_hostname: data.db_hostname,
            db_port: data.db_port, // Assuming the form sends this as an integer now based on Pydantic
            user_id: data.user_id,
            password: data.password,
            project_db: data.database || null, // Optional database field
        });
        return response.data; // This will be the TestConnectionResponse object
    } catch (error) {
        console.error("Error testing connection:", error);
        throw error;
    }
};

/**
 * Creates a new database connection.
 * @param {object} data - Connection details from the form (matches Pydantic DBConnectionCreate structure).
 * @returns {Promise<object>} - The response data from the API (matches Pydantic DBConnectionOut).
 */
export const createConnection = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/connections`, {
            // The payload structure directly matches the DBConnectionCreate Pydantic model
            project_code: data.project_code,
            connection_name: data.connection_name,
            connection_description: data.connection_description || null, // Use null for optional fields
            sql_flavor: data.sql_flavor,
            project_host: data.project_host,
            project_port: data.project_port, // This should be a string from the form now
            project_user: data.project_user,
            password: data.password, // Backend handles encryption
            project_db: data.project_db || null, // Use null for optional fields
            // Include other optional fields if your form sends them and backend expects them
            // max_threads: data.max_threads,
            // max_query_chars: data.max_query_chars,
            // url: data.url || null,
            // connect_by_url: data.connect_by_url || false,
            // connect_by_key: data.connect_by_key || false,
            // private_key: data.private_key || null,
            // private_key_passphrase: data.private_key_passphrase || null,
            // http_path: data.http_path || null,
        });
        return response.data; // This will be the DBConnectionOut object
    } catch (error) {
        console.error("Error creating connection:", error);
        throw error;
    }
};

/**
 * Retrieves all database connections.
 * @returns {Promise<object[]>} - The list of connections (matches Pydantic DBConnectionOut[]).
 */
export const getAllConnections = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/connections`);
        return response.data; // This will be an array of DBConnectionOut objects
    } catch (error) {
        console.error("Error getting all connections:", error);
        throw error;
    }
};

/**
 * Retrieves a single database connection by ID.
 * @param {number | string} id - Connection ID (BIGINT or UUID).
 * @returns {Promise<object>} - The connection data (matches Pydantic DBConnectionOut).
 */
export const getConnectionById = async (id) => {
    try {
        // Assuming the API endpoint for getting by ID uses the BIGINT connection_id
        // If it uses the UUID 'id', change the endpoint path accordingly.
        const response = await axios.get(`${BASE_URL}/connections/${id}`);
        return response.data; // This will be the DBConnectionOut object
    } catch (error) {
        console.error("Error getting connection by ID:", error);
        throw error;
    }
};

/**
 * Updates an existing database connection.
 * @param {number | string} id - The connection ID (BIGINT or UUID).
 * @param {object} data - Updated connection details from the form (matches Pydantic DBConnectionUpdate structure).
 * @returns {Promise<object>} - The updated connection data (matches Pydantic DBConnectionOut).
 */
export const updateConnection = async (id, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/connections/${id}`, {
            // The payload structure directly matches the DBConnectionUpdate Pydantic model
            project_code: data.project_code, // Assuming project_code can be updated
            connection_name: data.connection_name,
            connection_description: data.connection_description || null,
            sql_flavor: data.sql_flavor,
            project_host: data.project_host,
            project_port: data.project_port, // This should be a string from the form now
            project_user: data.project_user,
            password: data.password || undefined, // Use undefined to omit the field if no password is provided
            project_db: data.project_db || null,
            // Include other optional fields if your form sends them and backend expects them
            // max_threads: data.max_threads,
            // max_query_chars: data.max_query_chars,
            // url: data.url || null,
            // connect_by_url: data.connect_by_url || false,
            // connect_by_key: data.connect_by_key || false,
            // private_key: data.private_key || null,
            // private_key_passphrase: data.private_key_passphrase || null,
            // http_path: data.http_path || null,
        });
        return response.data; // This will be the updated DBConnectionOut object
    } catch (error) {
        console.error("Error updating connection:", error);
        throw error;
    }
};

/**
 * Deletes a database connection by its ID.
 * @param {number | string} id - The connection ID (BIGINT or UUID).
 * @returns {Promise<object>} - The response status.
 */
export const deleteConnection = async (id) => {
    try {
        // Assuming the API endpoint for deleting by ID uses the BIGINT connection_id
        const response = await axios.delete(`${BASE_URL}/connections/${id}`);
        return response.data; // This will return a success message, like { "message": "Connection deleted successfully" }
    } catch (error) {
        console.error("Error deleting connection:", error);
        throw error;
    }
};

/**
 * Gets profiling data for a connection.
 * @param {number | string} connection_id - The connection ID (BIGINT or UUID).
 * @param {object} connectionData - Connection details (matches Pydantic ConnectionProfilingRequest structure).
 * @returns {Promise<object>} - The profiling data.
 */
export const getConnectionProfiling = async (connection_id, connectionData) => {
    try {
        // Using axios for consistency and better error handling
        const response = await axios.post(`${BASE_URL}/connection/${connection_id}/profiling`, connectionData);
        return response.data;
    } catch (error) {
        console.error("Error fetching profiling data:", error);
        throw error;
    }
};

/**
 * Creates a new table group for a connection.
 * @param {number | string} connection_id - The connection ID (BIGINT or UUID).
 * @param {object} data - Table group details from the modal (matches Pydantic TableGroupCreate structure).
 * @returns {Promise<object>} - The created table group data (matches Pydantic TableGroupOut).
 */
export const createTableGroup = async (connection_id, data) => {
    try {
        const response = await axios.post(`${baseURL}/connection/${connection_id}/table-groups`, {
            // The payload structure directly matches the TableGroupCreate Pydantic model
            table_group_name: data.table_group_name,
            table_group_schema: data.table_group_schema || null,
            explicit_table_list: data.explicit_table_list,//  if we want array to pass then Array.isArray(data.explicit_table_list) ? data.explicit_table_list.join(',') : (data.explicit_table_list || null), // Convert list to comma-separated string
            profiling_include_mask: data.profiling_include_mask || null,
            profiling_exclude_mask: data.profiling_exclude_mask || null,
            profile_id_column_mask: data.profile_id_column_mask || '%id',
            profile_sk_column_mask: data.profile_sk_column_mask || '%_sk',
            profile_use_sampling: data.profile_use_sampling || 'N',
            profile_sample_percent: data.profile_sample_percent || '30', // Ensure this is a string
            profile_sample_min_count: data.profile_sample_min_count || 100000,
            profiling_delay_days: data.min_profiling_age_days ? String(data.min_profiling_age_days) : '0', // Convert integer to string
            profile_flag_cdes: data.profile_flag_cdes || true,
            profile_do_pair_rules: data.profile_do_pair_rules || 'N',
            profile_pair_rule_pct: data.profile_pair_rule_pct || 95,
            description: data.description || null,
            data_source: data.data_source || null,
            source_system: data.source_system || null,
            source_process: data.source_process || null,
            data_location: data.data_location || null,
            business_domain: data.business_domain || null,
            stakeholder_group: data.stakeholder_group || null,
            transform_level: data.transform_level || null,
            data_product: data.data_product || null,
            last_complete_profile_run_id: data.last_complete_profile_run_id || null,
            dq_score_profiling: data.dq_score_profiling || null,
            dq_score_testing: data.dq_score_testing || null,
            // project_code and connection_id are handled by the backend based on the URL and connection lookup
        });
        return response.data; // This will be the TableGroupOut object
    } catch (error) {
        console.error("Error creating table group:", error);
        throw error;
    }
};

/* dumy -__________________--------------------------------------------------------------



/**
 * Fetches all table groups for a given connection ID.
 * @param {number | string} connection_id - The connection ID.
 * @returns {Promise<Array>} - A promise that resolves to an array of table groups.
 */
export const getTableGroups = async (connection_id) => {
    try {
        const response = await axios.get(`${baseURL}/connection/${connection_id}/table-groups/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching table groups:", error);
        throw error;
    }
};

/**
 * Fetches a specific table group by its ID for a given connection ID.
 * @param {number | string} connection_id - The connection ID.
 * @param {number | string} group_id - The table group ID.
 * @returns {Promise<Object>} - A promise that resolves to the table group object.
 */
export const getTableGroupById = async (connection_id, group_id) => {
    try {
        const response = await axios.get(`${baseURL}/connection/${connection_id}/table-groups/${group_id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching specific table group:", error);
        throw error;
    }
};

/**
 * Retrieves all table groups for a connection.
 * @param {number | string} connection_id - The connection ID (BIGINT or UUID).
 * @returns {Promise<object[]>} - The list of table groups (matches Pydantic TableGroupOut[]).
 */
// export const getTableGroups = async (connection_id) => {
//     try {
//         const response = await axios.get(`${baseURL}/connection/${connection_id}/table-groups/`);
//         return response.data; // This will be an array of TableGroupOut objects
//     } catch (error) {
//         console.error("Error getting table groups:", error);
//         throw error;
//     }
// };

/**
 * Retrieves a specific table group for a connection by its ID.
 * @param {number | string} connection_id - The connection ID.
 * @param {string} group_id - The group ID to retrieve.
 * @returns {Promise<object>} - The specific table group data (matches Pydantic TableGroupOut).
 */
export const getSpecificTableGroup = async (connection_id, group_id) => {
    try {
        const response = await axios.get(`${baseURL}/connection/${connection_id}/table-groups/${group_id}`);
        return response.data; // This will be a single TableGroupOut object
    } catch (error) {
        console.error(`Error getting table group ${group_id}:`, error);
        throw error;
    }
};


/**
 * Deletes a table group for a connection.
 * @param {number | string} connection_id - The connection ID.
 * @param {string} group_id - The group ID to delete.
 * @returns {Promise<void>}
 */
export const deleteTableGroup = async (connection_id, group_id) => {
    try {
        await axios.delete(`${baseURL}/connection/${connection_id}/table-groups/${group_id}`);
    } catch (error) {
        console.error("Error deleting table group:", error);
        throw error;
    }
};

/**
 * Updates an existing table group for a connection.
 * @param {number | string} connection_id - The connection ID.
 * @param {string} group_id - The group ID to update.
 * @param {object} data - Updated table group details (matching TableGroupUpdate Pydantic model).
 * @returns {Promise<object>} - The updated table group data.
 */
/**
 * Updates an existing table group for a connection.
 * @param {number | string} connection_id - The connection ID.
 * @param {string} group_id - The group ID to update.
 * @param {object} data - Updated table group details (should have keys matching TableGroupBase/Update model).
 * @returns {Promise<object>} - The updated table group data (matches Pydantic TableGroupOut).
 */
export const updateTableGroup = async (connection_id, group_id, data) => {
    try {
        // Construct the payload object correctly
        const updatePayload = {
            // Ensure the keys here match your backend Pydantic TableGroupUpdate model (likely inherits from TableGroupBase)
            table_group_name: data.table_group_name,
            table_group_schema: data.table_group_schema || null,

            // FIX: Send explicit_table_list as an Array of strings, not a comma-separated string
            explicit_table_list: data.explicit_table_list,

            profiling_include_mask: data.profiling_include_mask || null,
            profiling_exclude_mask: data.profiling_exclude_mask || null,
            profile_id_column_mask: data.profile_id_column_mask || '%id',
            profile_sk_column_mask: data.profile_sk_column_mask || '%_sk',
            profile_use_sampling: data.profile_use_sampling || 'N',
            profile_sample_percent: data.profile_sample_percent || '30', // Backend expects string
            profile_sample_min_count: data.profile_sample_min_count || 100000,

            // FIX: Send min_profiling_age_days as an Integer or null, not a string
            min_profiling_age_days: data.min_profiling_age_days === null || data.min_profiling_age_days === undefined ? null : parseInt(data.min_profiling_age_days, 10), // Ensure it's int or null

            profile_flag_cdes: data.profile_flag_cdes === null || data.profile_flag_cdes === undefined ? true : data.profile_flag_cdes, // Default to true if null/undefined
            profile_do_pair_rules: data.profile_do_pair_rules || 'N',
            profile_pair_rule_pct: data.profile_pair_rule_pct === null || data.profile_pair_rule_pct === undefined ? 95 : parseInt(data.profile_pair_rule_pct, 10), // Ensure it's int or null/default

            description: data.description || null,
            data_source: data.data_source || null,
            source_system: data.source_system || null,
            source_process: data.source_process || null,
            data_location: data.data_location || null,
            business_domain: data.business_domain || null,
            stakeholder_group: data.stakeholder_group || null,
            transform_level: data.transform_level || null,
            data_product: data.data_product || null,

            // Handle potential UUID/string, send as is or null
            last_complete_profile_run_id: data.last_complete_profile_run_id || null,

            dq_score_profiling: data.dq_score_profiling === null || data.dq_score_profiling === undefined ? null : parseFloat(data.dq_score_profiling), // Ensure it's float or null
            dq_score_testing: data.dq_score_testing === null || data.dq_score_testing === undefined ? null : parseFloat(data.dq_score_testing), // Ensure it's float or null
        };

        console.log("Sending update payload for group", group_id, ":", updatePayload); // Log the payload being sent

        const response = await axios.put(`${baseURL}/connection/${connection_id}/table-groups/${group_id}`, updatePayload);

        console.log("Update successful:", response.data); // Log the success response
        return response.data; // Return the updated group data

    } catch (error) {
        console.error("Error updating table group:", error);
        // Re-throwing the error is good practice so the calling component can catch it
        throw error;
    }
};


/**
 * Triggers a profiling job for a specific table group within a connection.
 * @param {number | string} connectionId - The connection ID (BIGINT or UUID).
 * @param {string} tableGroupId - The ID of the table group to profile.
 * @returns {Promise<object>} - The response data from the API (e.g., job ID or status).
 */
export const triggerProfiling = async (requestPayload) => {
    try {
        console.log(
            `Attempting to trigger profiling for Connection ID: ${requestPayload.connection_id}, Table Group ID: ${requestPayload.table_group_id}`
        );

        const response = await axios.post(`${BASE_URL}/run-profiling`, {
            connection_id: requestPayload.connection_id,
            table_group_id: requestPayload.table_group_id,
        });

        console.log('Profiling trigger response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error triggering profiling job:', error);
        throw error;
    }
};



export const fetchDashboardSummary = async () => {
    const response = await axios.get(`${BASE_URL}/home`);
    return response.data; // { connections: number, table_groups: number, profiling_runs: number, runs: [...] }
};


export const fetchProfileResult = async (conn_id, profileresult_id) => {
    const response = await axios.get(
        `${BASE_URL}/${conn_id}/profileresult/${profileresult_id}`
    );
    return response.data;
};


export const fetchLatestProfilingRun = async () => {
    const response = await axios.get(`${BASE_URL}/latest-profiling-run`);
    return response.data;
}; 