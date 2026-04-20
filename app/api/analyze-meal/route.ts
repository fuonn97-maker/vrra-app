import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface MealData {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Calculate meal score based on macronutrients
function calculateMealScore(meal: MealData): number {
  const { calories, protein, carbs, fat } = meal

  // Optimal macro ratios for balanced nutrition
  // Protein: 20-35%, Carbs: 45-65%, Fat: 20-35%
  const totalCalories = protein * 4 + carbs * 4 + fat * 9

  if (totalCalories === 0) return 0

  const proteinRatio = (protein * 4) / totalCalories
  const carbsRatio = (carbs * 4) / totalCalories
  const fatRatio = (fat * 9) / totalCalories

  let score = 50 // Start with base score

  // Protein scoring (ideal: 20-35%)
  if (proteinRatio >= 0.2 && proteinRatio <= 0.35) {
    score += 25
  } else if (proteinRatio >= 0.15 && proteinRatio <= 0.4) {
    score += 15
  } else if (proteinRatio >= 0.1 && proteinRatio <= 0.45) {
    score += 5
  }

  // Carbs scoring (ideal: 45-65%)
  if (carbsRatio >= 0.45 && carbsRatio <= 0.65) {
    score += 20
  } else if (carbsRatio >= 0.35 && carbsRatio <= 0.75) {
    score += 10
  }

  // Fat scoring (ideal: 20-35%)
  if (fatRatio >= 0.2 && fatRatio <= 0.35) {
    score += 15
  } else if (fatRatio >= 0.15 && fatRatio <= 0.4) {
    score += 10
  }

  // Calorie balance (300-800 kcal is ideal for a meal)
  if (calories >= 300 && calories <= 800) {
    score += 10
  } else if (calories >= 200 && calories <= 1000) {
    score += 5
  }

  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, score))
}

// Get feedback based on meal score
function getMealFeedback(score: number): { message: string; type: 'excellent' | 'good' | 'fair' | 'improve' } {
  if (score >= 85) {
    return {
      message: '✨ Excellent! This meal has great macro balance and is perfect for your fitness goals.',
      type: 'excellent',
    }
  } else if (score >= 70) {
    return {
      message: '👍 Good meal! The nutrition is well-balanced. Consider adding more vegetables for micronutrients.',
      type: 'good',
    }
  } else if (score >= 50) {
    return {
      message: '⚠️ Fair nutritional profile. Try increasing protein or reducing refined carbs.',
      type: 'fair',
    }
  } else {
    return {
      message: '💡 Opportunity to improve! Focus on adding lean protein and whole grains.',
      type: 'improve',
    }
  }
}

export async function POST(req: NextRequest) {
  console.log('[v0] Running analyze-meal route')
  console.log('[v0] Has OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY)

  try {
    if (!OPENAI_API_KEY) {
      const errorMsg = 'OPENAI_API_KEY is missing on this runtime'
      console.error('[v0]', errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    console.log('[v0] Image received, sending to OpenAI API')

    // Call OpenAI Vision API using gpt-4-turbo
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image and provide nutritional information. Return ONLY a valid JSON object (no markdown formatting, no extra text before or after) with these exact fields: foodName (string), calories (number), protein (number in grams), carbs (number in grams), fat (number in grams), insight (string with brief healthy eating insight about this meal). Be realistic with portions. Example: {"foodName":"Grilled Chicken with Rice","calories":450,"protein":38,"carbs":48,"fat":12,"insight":"Balanced meal with good protein and complex carbs"}',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    console.log('[v0] OpenAI response status:', response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `OpenAI API error (${response.status}): ${response.statusText}`
      let errorDetails = ''
      
      try {
        const errorData = await response.json()
        errorDetails = JSON.stringify(errorData)
        console.error('[v0] OpenAI error response:', errorData)
        
        // Extract the error message from OpenAI response
        if (errorData.error?.message) {
          errorMessage = `OpenAI error: ${errorData.error.message}`
        }
      } catch (parseErr) {
        const textError = await response.text()
        errorDetails = textError
        console.error('[v0] OpenAI error text:', textError)
      }
      
      console.error('[v0] Full error details:', errorDetails)
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log('[v0] OpenAI response received successfully')

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('[v0] No content in OpenAI response. Full response:', data)
      return NextResponse.json(
        { error: 'OpenAI returned empty response' },
        { status: 500 }
      )
    }

    console.log('[v0] OpenAI content extracted:', content.substring(0, 100))

    // Parse JSON response - handle cases where JSON might be wrapped in markdown
    let nutritionData
    try {
      // First, try direct JSON parse
      nutritionData = JSON.parse(content)
      console.log('[v0] JSON parsed successfully')
    } catch (parseError) {
      console.log('[v0] Direct JSON parse failed, attempting regex extraction')
      // Try to extract JSON from markdown code blocks or other wrapping
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          nutritionData = JSON.parse(jsonMatch[0])
          console.log('[v0] JSON extracted and parsed from content')
        } catch (secondParseError) {
          console.error('[v0] Failed to parse extracted JSON:', jsonMatch[0])
          return NextResponse.json(
            { error: 'Failed to parse nutrition data from OpenAI response' },
            { status: 500 }
          )
        }
      } else {
        console.error('[v0] Failed to parse OpenAI response - no JSON found. Raw content:', content)
        return NextResponse.json(
          { error: 'OpenAI returned non-JSON response' },
          { status: 500 }
        )
      }
    }

    // Validate required fields
    if (!nutritionData.foodName || typeof nutritionData.calories !== 'number') {
      console.error('[v0] Invalid nutrition data structure:', nutritionData)
      return NextResponse.json(
        { error: 'Invalid nutrition data format from OpenAI' },
        { status: 500 }
      )
    }

    console.log('[v0] Nutrition data validated successfully')

    // Calculate meal score
    const mealScore = calculateMealScore({
      calories: Math.round(nutritionData.calories),
      protein: Math.round(nutritionData.protein),
      carbs: Math.round(nutritionData.carbs),
      fat: Math.round(nutritionData.fat),
    })

    const feedback = getMealFeedback(mealScore)

    return NextResponse.json({
      foodName: nutritionData.foodName || 'Unknown meal',
      calories: Math.round(nutritionData.calories) || 400,
      protein: Math.round(nutritionData.protein) || 25,
      carbs: Math.round(nutritionData.carbs) || 40,
      fat: Math.round(nutritionData.fat) || 15,
      insight: nutritionData.insight || 'Enjoy your meal!',
      mealScore,
      feedback,
    })
  } catch (error) {
    console.error('[v0] Analyze meal error:', error instanceof Error ? error.message : String(error))
    console.error('[v0] Full error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}
