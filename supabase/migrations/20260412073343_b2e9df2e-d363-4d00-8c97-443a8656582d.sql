
-- Step 1: Create a temp table of matched pairs
CREATE TEMP TABLE dedup_matches AS
WITH etnet_n AS (
  SELECT id, etnet_fund_id, name, trustee_name, scheme_name,
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      CASE WHEN name LIKE trustee_name || scheme_name || '%' 
           THEN SUBSTRING(name FROM LENGTH(trustee_name || scheme_name) + 1)
           WHEN name LIKE trustee_name || '%'
           THEN SUBSTRING(name FROM LENGTH(trustee_name) + 1)
           ELSE name END,
      '800', ''), ' ', ''), '-', ''), '　', ''), '\', ''), 'MPF', '')
    as core
  FROM mpf_funds WHERE etnet_fund_id LIKE 'ETNSI%' AND trustee_name IS NOT NULL
),
mpfa_n AS (
  SELECT id, etnet_fund_id, name_zh, trustee_name, scheme_name,
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      CASE WHEN name_zh LIKE trustee_name || ' MPF %' 
           THEN SUBSTRING(name_zh FROM LENGTH(trustee_name || ' MPF ') + 1)
           WHEN name_zh LIKE trustee_name || '%'
           THEN SUBSTRING(name_zh FROM LENGTH(trustee_name) + 1)
           ELSE COALESCE(name_zh, '') END,
      '單位', ''), '類', ''), ' ', ''), '-', ''), '　', ''), '\', ''), 'MPF', ''), '800', '')
    as core
  FROM mpf_funds WHERE etnet_fund_id LIKE 'MPFA_%' AND trustee_name IS NOT NULL
)
SELECT DISTINCT ON (e.id) e.id as etnet_id, m.id as mpfa_id
FROM etnet_n e
JOIN mpfa_n m ON e.trustee_name = m.trustee_name AND e.scheme_name = m.scheme_name AND e.core = m.core
ORDER BY e.id;

-- Step 2: Merge ETNET return data into MPFA records (only fill NULLs)
UPDATE mpf_funds mpfa SET
  return_ytd = COALESCE(mpfa.return_ytd, e.return_ytd),
  return_1m = COALESCE(mpfa.return_1m, e.return_1m),
  return_3m = COALESCE(mpfa.return_3m, e.return_3m),
  return_1y = COALESCE(mpfa.return_1y, e.return_1y),
  return_3y = COALESCE(mpfa.return_3y, e.return_3y),
  return_5y = COALESCE(mpfa.return_5y, e.return_5y),
  return_10y = COALESCE(mpfa.return_10y, e.return_10y),
  return_2021 = COALESCE(mpfa.return_2021, e.return_2021),
  return_2022 = COALESCE(mpfa.return_2022, e.return_2022),
  return_2023 = COALESCE(mpfa.return_2023, e.return_2023),
  return_2024 = COALESCE(mpfa.return_2024, e.return_2024),
  return_2025 = COALESCE(mpfa.return_2025, e.return_2025),
  return_since_launch = COALESCE(mpfa.return_since_launch, e.return_since_launch),
  fer = COALESCE(mpfa.fer, e.fer),
  fee_ratio = COALESCE(mpfa.fee_ratio, e.fee_ratio),
  fund_size = COALESCE(mpfa.fund_size, e.fund_size),
  risk_level = COALESCE(mpfa.risk_level, e.risk_level),
  launch_date = COALESCE(mpfa.launch_date, e.launch_date)
FROM dedup_matches dm
JOIN mpf_funds e ON e.id = dm.etnet_id
WHERE mpfa.id = dm.mpfa_id;

-- Step 3: Delete matched ETNET duplicates
DELETE FROM mpf_funds WHERE id IN (SELECT etnet_id FROM dedup_matches);

-- Cleanup
DROP TABLE dedup_matches;
