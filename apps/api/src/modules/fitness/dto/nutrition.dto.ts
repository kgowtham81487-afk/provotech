export interface LogFoodDiaryEntryDto {
  foodId?: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';
  foodName: string;
  servingQuantity: number;
  servingUnit?: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fibreGrams?: number;
  loggedDate?: string; // ISO date string
}

export interface LogWaterDto {
  amountMl: number;
  loggedDate?: string;
}

export interface CreateCustomFoodDto {
  name: string;
  category?: string;
  servingSize?: number;
  servingUnit?: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fibreGrams?: number;
  region?: string;
}

export interface EstimateMacrosDto {
  description: string;
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS';
}

export interface EstimatedFoodItem {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fibreGrams: number;
}

export interface MacroEstimationResult {
  mealType: string;
  description: string;
  items: EstimatedFoodItem[];
  totals: {
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    fibreGrams: number;
  };
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
  provider: string;
  model: string;
  fallbackOccurred: boolean;
}


