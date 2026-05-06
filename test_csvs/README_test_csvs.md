# Strum Demand Planning Test CSVs

## Happy-path files

- `aggregated_data_valid.csv`
- `forecast_data_valid.csv`

These files test:
- Multiple SKUs
- Latest inference date per SKU
- Older stale forecast runs
- 13-week historical windows
- 40-week forecast arrays
- p05-p95 percentile bands
- Projected demand drivers
- Previous-year actuals available for only one SKU
- Alert scenarios:
  - stable SKU
  - forecast spike SKU
  - low projected in-stock SKU

## Failure-case files

- `aggregated_data_failure_cases.csv`
- `forecast_data_failure_cases.csv`

These files intentionally include invalid rows to test ingestion validation and error reporting.

### Aggregated failure cases

- Missing `item_id`
- Invalid `timestamp`
- Non-numeric `units_sold`
- Invalid `demand_drivers` JSON
- Missing `avg_unit_price`
- `cust_instock` outside 0-1
- Negative `units_sold`
- Duplicate natural key: `item_id + timestamp`

### Forecast failure cases

- Missing `item_id`
- Invalid `inference_date`
- Invalid `forecasts` JSON
- Forecast array with fewer than 40 weeks
- Missing percentile field
- Invalid percentile ordering
- Invalid projected `demand_drivers` JSON
- Projected `cust_instock` outside 0-1
- Missing metadata fields

## Recommended validation behavior

For an MVP, fail fast during seed and print row-level errors with:
- file name
- row number
- item_id if available
- field name
- reason

A more tolerant mode can skip bad rows and produce an ingestion report, but fail-fast is cleaner for this assignment.
