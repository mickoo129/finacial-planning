## 目標
喺所有頁面嘅時間分段加多一項「1個月」（`1m`），其他邏輯/排序/UI 唔變。

## DB 數據現況
- `mpf_funds.return_1m`：559 隻基金中有 158 隻有數據（約 28%）
- 無數據嘅基金喺該分段會顯示「-」（沿用現有 NULL 處理）

## 改動清單

### 1. `src/types/mpf.ts`
- `TimePeriod` union 加 `'1m'`
- `TIME_PERIOD_LABELS` 加 `'1m': '1個月'`

### 2. `src/lib/returnFields.ts`
- `ReturnField` union 加 `'return_1m'`
- `RETURN_LABELS` 加 `return_1m: '1個月'`
- `RETURN_FIELDS` array 喺 `return_3m` 之前加 `'return_1m'`
- 移除頂部「return_1m removed」嘅過時註解

### 3. `src/components/TimePeriodSelector.tsx`
- `periods` array 喺 `'3m'` 之前加 `'1m'`，令所有用呢個 selector 嘅頁面（Rankings、Categories、SearchFunds、TrusteeCompare、CompareFunds、PortfolioSimulator、FundDetail）自動有「1個月」掣

### 4. `src/pages/FundDetail.tsx`
- `CHART_DAYS` map 加 `'1m': 30`（決定價格走勢圖顯示幾耐）

### 5. `src/data/mockData.ts`（如有用到）
- 檢查 mock fund 嘅 `returns` 物件有冇缺 `'1m'` key，缺嘅補一個合理數字避免 type error

## 唔會郁
- DB schema、scraper、edge functions、hooks、排序邏輯、預設組合範本嘅 3y/5y/10y 加權公式
- 預設排序欄位（Rankings 預設 1y、Index Top/Bottom 邏輯）

## 驗證
1. Rankings / Categories / SearchFunds / TrusteeCompare / CompareFunds / PortfolioSimulator 嘅時段切換掣會見到「1個月」喺「年初至今」同「3個月」之間
2. FundDetail 撳「1個月」價格圖會顯示最近 30 日
3. 冇 1個月數據嘅基金會顯示「-」，唔會 crash