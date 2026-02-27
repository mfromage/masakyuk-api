import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
import { createDb } from './connection.js';
import { recipes, recipeImages, tags, recipeTags, affiliateProducts } from './schema/index.js';

const db = createDb(process.env.DATABASE_URL!);

async function seed() {
  console.log('Seeding database...');

  // ── Tags ──
  const tagData = [
    // Cuisine
    { key: 'indonesian', type: 'cuisine', labelEn: 'Indonesian', labelId: 'Indonesia' },
    { key: 'japanese', type: 'cuisine', labelEn: 'Japanese', labelId: 'Jepang' },
    { key: 'chinese', type: 'cuisine', labelEn: 'Chinese', labelId: 'Cina' },
    { key: 'korean', type: 'cuisine', labelEn: 'Korean', labelId: 'Korea' },
    { key: 'western', type: 'cuisine', labelEn: 'Western', labelId: 'Barat' },
    { key: 'indian', type: 'cuisine', labelEn: 'Indian', labelId: 'India' },
    { key: 'thai', type: 'cuisine', labelEn: 'Thai', labelId: 'Thailand' },
    { key: 'malay', type: 'cuisine', labelEn: 'Malay', labelId: 'Melayu' },
    // Diet
    { key: 'vegetarian', type: 'diet', labelEn: 'Vegetarian', labelId: 'Vegetarian' },
    { key: 'vegan', type: 'diet', labelEn: 'Vegan', labelId: 'Vegan' },
    { key: 'halal', type: 'diet', labelEn: 'Halal', labelId: 'Halal' },
    { key: 'gluten-free', type: 'diet', labelEn: 'Gluten Free', labelId: 'Bebas Gluten' },
    { key: 'dairy-free', type: 'diet', labelEn: 'Dairy Free', labelId: 'Bebas Susu' },
    { key: 'low-carb', type: 'diet', labelEn: 'Low Carb', labelId: 'Rendah Karbohidrat' },
    // Difficulty
    { key: 'easy', type: 'difficulty', labelEn: 'Easy', labelId: 'Mudah' },
    { key: 'medium', type: 'difficulty', labelEn: 'Medium', labelId: 'Sedang' },
    { key: 'hard', type: 'difficulty', labelEn: 'Hard', labelId: 'Sulit' },
    // Time
    { key: 'under-15min', type: 'time', labelEn: 'Under 15 min', labelId: 'Kurang dari 15 menit' },
    { key: 'under-30min', type: 'time', labelEn: 'Under 30 min', labelId: 'Kurang dari 30 menit' },
    { key: 'under-60min', type: 'time', labelEn: 'Under 1 hour', labelId: 'Kurang dari 1 jam' },
    { key: 'over-60min', type: 'time', labelEn: 'Over 1 hour', labelId: 'Lebih dari 1 jam' },
    // Meal type
    { key: 'breakfast', type: 'meal', labelEn: 'Breakfast', labelId: 'Sarapan' },
    { key: 'lunch', type: 'meal', labelEn: 'Lunch', labelId: 'Makan Siang' },
    { key: 'dinner', type: 'meal', labelEn: 'Dinner', labelId: 'Makan Malam' },
    { key: 'snack', type: 'meal', labelEn: 'Snack', labelId: 'Camilan' },
    { key: 'dessert', type: 'meal', labelEn: 'Dessert', labelId: 'Hidangan Penutup' },
    { key: 'side-dish', type: 'meal', labelEn: 'Side Dish', labelId: 'Lauk' },
  ];

  await db.insert(tags).values(tagData).onConflictDoNothing();
  console.log(`  Inserted ${tagData.length} tags`);

  // ── Recipes ──
  const recipeData = [
    {
      name: 'Nasi Goreng',
      description: 'Classic Indonesian fried rice with sweet soy sauce and sambal',
      cookingTimeMinutes: 20,
      source: 'Traditional',
      allergies: 'soy, egg',
      ingredients: [
        { name: 'nasi putih', amount: 200, unit: 'gram' },
        { name: 'minyak goreng', amount: 2, unit: 'sdm' },
        { name: 'bawang putih', amount: 3, unit: 'siung' },
        { name: 'bawang merah', amount: 4, unit: 'siung' },
        { name: 'kecap manis', amount: 2, unit: 'sdm' },
        { name: 'telur', amount: 1, unit: 'butir' },
        { name: 'garam', amount: 0, unit: 'secukupnya' },
      ],
      steps: [
        'Panaskan minyak goreng di wajan',
        'Tumis bawang putih dan bawang merah hingga harum',
        'Masukkan nasi putih, aduk rata',
        'Tambahkan kecap manis dan garam, aduk hingga merata',
        'Goreng telur di samping, sajikan di atas nasi',
      ],
    },
    {
      name: 'Soto Ayam',
      description: 'Indonesian chicken soup with turmeric, lemongrass, and glass noodles',
      cookingTimeMinutes: 45,
      source: 'Traditional',
      allergies: null,
      ingredients: [
        { name: 'ayam', amount: 500, unit: 'gram' },
        { name: 'kunyit', amount: 2, unit: 'cm' },
        { name: 'serai', amount: 2, unit: 'batang' },
        { name: 'soun', amount: 100, unit: 'gram' },
        { name: 'bawang putih', amount: 3, unit: 'siung' },
        { name: 'daun jeruk', amount: 3, unit: 'lembar' },
      ],
      steps: [
        'Rebus ayam dengan air, kunyit, serai, dan daun jeruk',
        'Angkat ayam, suwir-suwir dagingnya',
        'Saring kaldu, masukkan kembali ayam suwir',
        'Rebus soun hingga lunak, tiriskan',
        'Sajikan kaldu dengan soun dan ayam suwir',
      ],
    },
    {
      name: 'Gado-gado',
      description: 'Indonesian peanut sauce salad with mixed vegetables and tofu',
      cookingTimeMinutes: 30,
      source: 'Traditional',
      allergies: 'peanut',
      ingredients: [
        { name: 'kacang tanah', amount: 200, unit: 'gram' },
        { name: 'tahu', amount: 200, unit: 'gram' },
        { name: 'tempe', amount: 200, unit: 'gram' },
        { name: 'kangkung', amount: 1, unit: 'ikat' },
        { name: 'tauge', amount: 100, unit: 'gram' },
        { name: 'kentang', amount: 2, unit: 'buah' },
      ],
      steps: [
        'Goreng kacang tanah, haluskan untuk bumbu',
        'Rebus kangkung, tauge, dan kentang',
        'Goreng tahu dan tempe hingga kecokelatan',
        'Siram sayuran dengan bumbu kacang',
      ],
    },
  ];

  const insertedRecipes = await db
    .insert(recipes)
    .values(recipeData)
    .onConflictDoNothing()
    .returning();
  console.log(`  Inserted ${insertedRecipes.length} recipes`);

  if (insertedRecipes.length > 0) {
    // ── Images ──
    const imageData = [
      {
        recipeId: insertedRecipes[0].id,
        url: 'https://placehold.co/600x400?text=Nasi+Goreng',
        position: 0,
      },
      {
        recipeId: insertedRecipes[1].id,
        url: 'https://placehold.co/600x400?text=Soto+Ayam',
        position: 0,
      },
      {
        recipeId: insertedRecipes[2].id,
        url: 'https://placehold.co/600x400?text=Gado-gado',
        position: 0,
      },
    ];
    await db.insert(recipeImages).values(imageData).onConflictDoNothing();
    console.log(`  Inserted ${imageData.length} images`);

    // ── Recipe Tags ── (look up tag IDs from inserted tags)
    const allTags = await db.select().from(tags);
    const tagMap = new Map(allTags.map((t) => [t.key, t.id]));

    const recipeTagData = [
      // Nasi Goreng
      { recipeId: insertedRecipes[0].id, tagId: tagMap.get('indonesian')! },
      { recipeId: insertedRecipes[0].id, tagId: tagMap.get('halal')! },
      { recipeId: insertedRecipes[0].id, tagId: tagMap.get('easy')! },
      { recipeId: insertedRecipes[0].id, tagId: tagMap.get('under-30min')! },
      { recipeId: insertedRecipes[0].id, tagId: tagMap.get('lunch')! },
      { recipeId: insertedRecipes[0].id, tagId: tagMap.get('dinner')! },
      // Soto Ayam
      { recipeId: insertedRecipes[1].id, tagId: tagMap.get('indonesian')! },
      { recipeId: insertedRecipes[1].id, tagId: tagMap.get('halal')! },
      { recipeId: insertedRecipes[1].id, tagId: tagMap.get('medium')! },
      { recipeId: insertedRecipes[1].id, tagId: tagMap.get('under-60min')! },
      { recipeId: insertedRecipes[1].id, tagId: tagMap.get('lunch')! },
      // Gado-gado
      { recipeId: insertedRecipes[2].id, tagId: tagMap.get('indonesian')! },
      { recipeId: insertedRecipes[2].id, tagId: tagMap.get('vegetarian')! },
      { recipeId: insertedRecipes[2].id, tagId: tagMap.get('vegan')! },
      { recipeId: insertedRecipes[2].id, tagId: tagMap.get('halal')! },
      { recipeId: insertedRecipes[2].id, tagId: tagMap.get('easy')! },
      { recipeId: insertedRecipes[2].id, tagId: tagMap.get('under-30min')! },
    ];
    await db.insert(recipeTags).values(recipeTagData).onConflictDoNothing();
    console.log(`  Inserted ${recipeTagData.length} recipe-tag associations`);
  }

  // ── Affiliate Products ──
  const affiliateData = [
    {
      canonicalName: 'minyak goreng',
      link: 'https://tokopedia.link/minyak-goreng',
      aliases: ['cooking oil', 'vegetable oil'],
      category: 'oil',
    },
    {
      canonicalName: 'bawang putih',
      link: 'https://tokopedia.link/bawang-putih',
      aliases: ['garlic'],
      category: 'spice',
    },
    {
      canonicalName: 'bawang merah',
      link: 'https://tokopedia.link/bawang-merah',
      aliases: ['shallot', 'red onion'],
      category: 'spice',
    },
    {
      canonicalName: 'kecap manis',
      link: 'https://tokopedia.link/kecap-manis',
      aliases: ['sweet soy sauce'],
      category: 'sauce',
    },
    {
      canonicalName: 'garam',
      link: 'https://tokopedia.link/garam',
      aliases: ['salt'],
      category: 'seasoning',
    },
    {
      canonicalName: 'gula pasir',
      link: 'https://tokopedia.link/gula-pasir',
      aliases: ['sugar', 'white sugar'],
      category: 'seasoning',
    },
    {
      canonicalName: 'merica',
      link: 'https://tokopedia.link/merica',
      aliases: ['pepper', 'black pepper'],
      category: 'spice',
    },
    {
      canonicalName: 'kunyit',
      link: 'https://tokopedia.link/kunyit',
      aliases: ['turmeric'],
      category: 'spice',
    },
    {
      canonicalName: 'jahe',
      link: 'https://tokopedia.link/jahe',
      aliases: ['ginger'],
      category: 'spice',
    },
    {
      canonicalName: 'serai',
      link: 'https://tokopedia.link/serai',
      aliases: ['lemongrass'],
      category: 'herb',
    },
    {
      canonicalName: 'daun jeruk',
      link: 'https://tokopedia.link/daun-jeruk',
      aliases: ['kaffir lime leaves'],
      category: 'herb',
    },
    {
      canonicalName: 'daun salam',
      link: 'https://tokopedia.link/daun-salam',
      aliases: ['bay leaf', 'indonesian bay leaf'],
      category: 'herb',
    },
    {
      canonicalName: 'ketumbar',
      link: 'https://tokopedia.link/ketumbar',
      aliases: ['coriander', 'coriander seeds'],
      category: 'spice',
    },
    {
      canonicalName: 'cabai merah',
      link: 'https://tokopedia.link/cabai-merah',
      aliases: ['red chili', 'chili pepper'],
      category: 'spice',
    },
    {
      canonicalName: 'cabai rawit',
      link: 'https://tokopedia.link/cabai-rawit',
      aliases: ["bird's eye chili"],
      category: 'spice',
    },
    {
      canonicalName: 'kacang tanah',
      link: 'https://tokopedia.link/kacang-tanah',
      aliases: ['peanut', 'groundnut'],
      category: 'nut',
    },
    {
      canonicalName: 'santan',
      link: 'https://tokopedia.link/santan',
      aliases: ['coconut milk', 'coconut cream'],
      category: 'dairy-alt',
    },
    {
      canonicalName: 'tepung terigu',
      link: 'https://tokopedia.link/tepung-terigu',
      aliases: ['wheat flour', 'all-purpose flour'],
      category: 'flour',
    },
    {
      canonicalName: 'tepung beras',
      link: 'https://tokopedia.link/tepung-beras',
      aliases: ['rice flour'],
      category: 'flour',
    },
    {
      canonicalName: 'tahu',
      link: 'https://tokopedia.link/tahu',
      aliases: ['tofu', 'bean curd'],
      category: 'protein',
    },
    {
      canonicalName: 'tempe',
      link: 'https://tokopedia.link/tempe',
      aliases: ['tempeh'],
      category: 'protein',
    },
  ];

  await db.insert(affiliateProducts).values(affiliateData).onConflictDoNothing();
  console.log(`  Inserted ${affiliateData.length} affiliate products`);

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
