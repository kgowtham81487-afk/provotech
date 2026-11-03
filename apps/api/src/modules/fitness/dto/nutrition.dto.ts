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
