/**
 * Dice Rolling Utility for Weather Orchestrator and Future Features
 * 
 * Provides various dice rolling systems with different probability distributions:
 * - 2d6: Bell curve distribution (standard for orchestrator)
 * - 3d6: Tighter bell curve
 * - 1d20: Uniform distribution
 * 
 * @module DiceRoller
 */

export class DiceRoller {
  /**
   * Roll N dice with D sides
   * @param {number} count - Number of dice
   * @param {number} sides - Number of sides per die
   * @returns {number} Sum of all dice
   */
  static roll(count, sides) {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += Math.floor(Math.random() * sides) + 1;
    }
    return sum;
  }
  
  /**
   * Roll 2d6 (standard bell curve)
   * Result: 2-12, average 7
   * Probability: Bell curve with 16.67% at 7, 2.78% at 2/12
   * @returns {number} 2-12
   */
  static roll2d6() {
    return this.roll(2, 6);
  }
  
  /**
   * Roll 3d6 (tighter bell curve)
   * Result: 3-18, average 10.5
   * Probability: Tighter bell curve, more clustering around mean
   * @returns {number} 3-18
   */
  static roll3d6() {
    return this.roll(3, 6);
  }
  
  /**
   * Roll 1d20 (uniform distribution)
   * Result: 1-20, average 10.5
   * Probability: Equal 5% for each result
   * @returns {number} 1-20
   */
  static roll1d20() {
    return this.roll(1, 20);
  }
  
  /**
   * Get probability distribution for 2d6
   * @returns {Object} Map of result to probability
   */
  static get2d6Distribution() {
    return {
      2: 0.0278,  // 2.78% - 1 combo (1+1)
      3: 0.0556,  // 5.56% - 2 combos (1+2, 2+1)
      4: 0.0833,  // 8.33% - 3 combos
      5: 0.1111,  // 11.11% - 4 combos
      6: 0.1389,  // 13.89% - 5 combos
      7: 0.1667,  // 16.67% - 6 combos (most common)
      8: 0.1389,  // 13.89% - 5 combos
      9: 0.1111,  // 11.11% - 4 combos
      10: 0.0833, // 8.33% - 3 combos
      11: 0.0556, // 5.56% - 2 combos
      12: 0.0278  // 2.78% - 1 combo (6+6)
    };
  }
  
  /**
   * Get probability distribution for 3d6
   * @returns {Object} Map of result to probability
   */
  static get3d6Distribution() {
    return {
      3: 0.0046,  // 0.46%
      4: 0.0139,  // 1.39%
      5: 0.0278,  // 2.78%
      6: 0.0463,  // 4.63%
      7: 0.0694,  // 6.94%
      8: 0.0972,  // 9.72%
      9: 0.1157,  // 11.57%
      10: 0.1250, // 12.50% (most common)
      11: 0.1250, // 12.50% (most common)
      12: 0.1157, // 11.57%
      13: 0.0972, // 9.72%
      14: 0.0694, // 6.94%
      15: 0.0463, // 4.63%
      16: 0.0278, // 2.78%
      17: 0.0139, // 1.39%
      18: 0.0046  // 0.46%
    };
  }
  
  /**
   * Roll dice based on dice type string
   * @param {string} diceType - Type of dice ('2d6', '3d6', '1d20', 'custom')
   * @param {number} customCount - Number of dice for custom roll
   * @param {number} customSides - Number of sides for custom roll
   * @returns {number} Roll result
   */
  static rollByType(diceType, customCount = 2, customSides = 6) {
    switch (diceType.toLowerCase()) {
      case '2d6':
        return this.roll2d6();
      case '3d6':
        return this.roll3d6();
      case '1d20':
        return this.roll1d20();
      case 'custom':
        return this.roll(customCount, customSides);
      default:
        console.warn(`DiceRoller | Unknown dice type '${diceType}', defaulting to 2d6`);
        return this.roll2d6();
    }
  }
  
  /**
   * Test dice distribution over many rolls
   * Useful for validating randomness
   * @param {string} diceType - Type of dice to test
   * @param {number} rolls - Number of rolls to perform (default 10000)
   * @returns {Object} Statistics about the rolls
   */
  static testDistribution(diceType = '2d6', rolls = 10000) {
    const results = {};
    let sum = 0;
    
    for (let i = 0; i < rolls; i++) {
      const roll = this.rollByType(diceType);
      results[roll] = (results[roll] || 0) + 1;
      sum += roll;
    }
    
    // Calculate percentages
    const distribution = {};
    for (const [value, count] of Object.entries(results)) {
      distribution[value] = {
        count: count,
        percentage: (count / rolls * 100).toFixed(2) + '%',
        decimal: (count / rolls).toFixed(4)
      };
    }
    
    const average = sum / rolls;
    
    return {
      rolls: rolls,
      average: average.toFixed(2),
      distribution: distribution,
      diceType: diceType
    };
  }
  
  /**
   * Validate that a dice roll matches expected distribution
   * @param {string} diceType - Type of dice to validate
   * @param {number} rolls - Number of test rolls
   * @param {number} tolerance - Acceptable deviation percentage (default 1%)
   * @returns {boolean} True if distribution matches within tolerance
   */
  static validateDistribution(diceType = '2d6', rolls = 10000, tolerance = 1.0) {
    const test = this.testDistribution(diceType, rolls);
    let expectedDist;
    
    switch (diceType) {
      case '2d6':
        expectedDist = this.get2d6Distribution();
        break;
      case '3d6':
        expectedDist = this.get3d6Distribution();
        break;
      case '1d20':
        // Uniform distribution
        expectedDist = {};
        for (let i = 1; i <= 20; i++) {
          expectedDist[i] = 0.05; // 5% each
        }
        break;
      default:
        console.warn(`DiceRoller | No validation data for '${diceType}'`);
        return false;
    }
    
    // Check each result against expected probability
    for (const [value, expected] of Object.entries(expectedDist)) {
      const actual = parseFloat(test.distribution[value]?.decimal || 0);
      const deviation = Math.abs(actual - expected) * 100; // Convert to percentage
      
      if (deviation > tolerance) {
        console.warn(`DiceRoller | Value ${value} deviation ${deviation.toFixed(2)}% exceeds tolerance ${tolerance}%`);
        console.warn(`  Expected: ${(expected * 100).toFixed(2)}%, Actual: ${(actual * 100).toFixed(2)}%`);
        return false;
      }
    }
    
    console.log(`DiceRoller | Distribution validation passed for ${diceType} (${rolls} rolls, ±${tolerance}% tolerance)`);
    return true;
  }
}
