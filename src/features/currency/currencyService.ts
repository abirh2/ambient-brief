import { MOCK_CURRENCY_RATES } from '../../lib/mocks/mockData';
import { CurrencyRate } from '../../lib/types';
import { CurrencyRateSchema } from '../../lib/validation/schemas';

export async function fetchCurrencyRates(): Promise<CurrencyRate[]> {
  return MOCK_CURRENCY_RATES.filter((rate) => CurrencyRateSchema.safeParse(rate).success);
}
