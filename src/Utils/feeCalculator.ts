import FeeStructure from '../Model/feeModel';

/**
 * Calculate fees for a story booking
 * @param baseAmount - The base price of the story
 * @param appliesTo - Who the fee applies to ('TRAVELLER', 'HOST', or 'BOTH')
 * @returns Object containing fee breakdown and total
 */
export const calculateStoryFees = async (
  baseAmount: number,
  appliesTo: 'TRAVELLER' | 'HOST' | 'BOTH' = 'TRAVELLER'
) => {
  try {
    // Fetch active fees that apply to stories (both GLOBAL and STORY scope) and the specified party
    const fees = await FeeStructure.find({
      isActive: true,
      scope: { $in: ['GLOBAL', 'STORY'] }, // Include both GLOBAL and STORY scopes
      $or: [{ appliesTo }, { appliesTo: 'BOTH' }],
    });

    let totalFees = 0;
    const feeBreakdown: Array<{
      feeName: string;
      feeType: string;
      value: number;
      calculatedAmount: number;
    }> = [];

    // Calculate each fee
    for (const fee of fees) {
      let calculatedAmount = 0;

      switch (fee.feeType) {
        case 'FLAT':
          calculatedAmount = fee.value;
          break;
        case 'PERCENTAGE':
          calculatedAmount = (baseAmount * fee.value) / 100;
          break;
        case 'COMMISSION':
          calculatedAmount = (baseAmount * fee.value) / 100;
          break;
        default:
          calculatedAmount = 0;
      }

      totalFees += calculatedAmount;
      feeBreakdown.push({
        feeName: fee.feeName,
        feeType: fee.feeType,
        value: fee.value,
        calculatedAmount: Math.round(calculatedAmount * 100) / 100, // Round to 2 decimal places
      });
    }

    return {
      totalFees: Math.round(totalFees * 100) / 100,
      feeBreakdown,
    };
  } catch (error) {
    console.error('Error calculating fees:', error);
    return {
      totalFees: 0,
      feeBreakdown: [],
    };
  }
};
