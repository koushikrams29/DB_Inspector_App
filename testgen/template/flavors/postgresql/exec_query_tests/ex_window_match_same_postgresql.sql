SELECT '{TEST_TYPE}'   as test_type,
       '{TEST_DEFINITION_ID}' as test_definition_id,
       '{TEST_SUITE_ID}' as test_suite_id,
       '{TEST_RUN_ID}' as test_run_id,
       '{RUN_DATE}'    as test_time,
       '{START_TIME}'  as starttime,
       CURRENT_TIMESTAMP       as endtime,
       '{SCHEMA_NAME}' as schema_name,
       '{TABLE_NAME}'  as table_name,
       '{COLUMN_NAME_NO_QUOTES}' as column_names,
       '{SKIP_ERRORS}' as threshold_value,
       {SKIP_ERRORS} as skip_errors,
       '{INPUT_PARAMETERS}' as input_parameters,
       CASE WHEN COUNT (*) > {SKIP_ERRORS} THEN 0 ELSE 1 END as result_code,
       CASE
        WHEN COUNT(*) > 0 THEN
               CONCAT(
                      CONCAT( CAST(COUNT(*) AS VARCHAR), ' error(s) identified, ' ),
                      CONCAT(
                             CASE
                               WHEN COUNT(*) > {SKIP_ERRORS} THEN 'exceeding limit of '
                                                                        ELSE 'within limit of '
                             END,
                             '{SKIP_ERRORS}.'
                             )
                      )
        ELSE 'No errors found.'
       END AS result_message,
       COUNT(*) as result_measure,
       '{SUBSET_DISPLAY}' as subset_condition,
       NULL as result_query
  FROM (
        (
SELECT 'Prior Timeframe' as missing_from, {COLUMN_NAME}
FROM {SCHEMA_NAME}.{TABLE_NAME}
WHERE {SUBSET_CONDITION}
  AND {WINDOW_DATE_COLUMN} >= (SELECT MAX({WINDOW_DATE_COLUMN}) FROM {SCHEMA_NAME}.{TABLE_NAME}) - {WINDOW_DAYS}
EXCEPT
SELECT 'Prior Timeframe' as missing_from, {COLUMN_NAME}
FROM {SCHEMA_NAME}.{TABLE_NAME}
WHERE {SUBSET_CONDITION}
  AND {WINDOW_DATE_COLUMN} >= (SELECT MAX({WINDOW_DATE_COLUMN}) FROM {SCHEMA_NAME}.{TABLE_NAME}) - 2 * {WINDOW_DAYS}
  AND {WINDOW_DATE_COLUMN} <  (SELECT MAX({WINDOW_DATE_COLUMN}) FROM {SCHEMA_NAME}.{TABLE_NAME}) - {WINDOW_DAYS}
)
UNION ALL
(
SELECT 'Latest Timeframe' as missing_from, {COLUMN_NAME}
FROM {SCHEMA_NAME}.{TABLE_NAME}
WHERE {SUBSET_CONDITION}
  AND {WINDOW_DATE_COLUMN} >= (SELECT MAX({WINDOW_DATE_COLUMN}) FROM {SCHEMA_NAME}.{TABLE_NAME}) - 2 * {WINDOW_DAYS}
  AND {WINDOW_DATE_COLUMN} < (SELECT MAX({WINDOW_DATE_COLUMN}) FROM {SCHEMA_NAME}.{TABLE_NAME}) - {WINDOW_DAYS}
    EXCEPT
SELECT 'Latest Timeframe' as missing_from, {COLUMN_NAME}
FROM {SCHEMA_NAME}.{TABLE_NAME}
WHERE {SUBSET_CONDITION}
  AND {WINDOW_DATE_COLUMN} >= (SELECT MAX({WINDOW_DATE_COLUMN}) FROM {SCHEMA_NAME}.{TABLE_NAME}) - {WINDOW_DAYS}
)
       ) test;
