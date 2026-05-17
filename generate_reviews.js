const fs = require('fs');

const firstNames = ["Priya", "Neha", "Sneha", "Kritika", "Anjali", "Meera", "Riya", "Aarti", "Pooja", "Swati", "Nidhi", "Kavita", "Simran", "Shruti", "Divya", "Sonal", "Shikha", "Jyoti", "Kiran", "Manisha", "Radhika", "Geeta", "Sushma", "Tanya", "Roshni", "Deepa"];
const lastNames = ["Sharma", "Gupta", "Singh", "Agarwal", "Jain", "Verma", "Yadav", "Rajput", "Chauhan", "Mishra", "Pandey", "Tiwari", "Garg", "Bansal", "Goyal", "Mathur", "Saxena", "Srivastava"];
const areas = ["Kamla Nagar", "Sanjay Place", "Dayalbagh", "Tajganj", "Sikandra", "Shastripuram", "Khandari", "Shahganj", "Fatehabad Road", "Lohamandi", "Balkeshwar", "Trans Yamuna", "Avas Vikas", "Kargil Petrol Pump", "Sadar Bazar", "Idgah"];
const roles = ["Bridal Client", "Event Booking", "Regular Client", "Party Booking", "Engagement Client", "Festival Booking"];
const reviewTemplates = [
  "Best experience ever! The {role} mehndi was so detailed and the stain was incredibly dark. Everyone loved it.",
  "Ordered express service for my {event}. They arrived exactly on time! The artist was very professional.",
  "I always book Jyoti Mehndi for festivals. They are the only ones I trust with organic henna.",
  "Stunning designs and very polite staff. They made my day special.",
  "Quick and beautiful. The organic henna smells amazing and leaves a rich color.",
  "Highly recommend! The artists are very talented and the prices are reasonable.",
  "I was amazed by the intricate details. Definitely the best mehndi artist in {area}.",
  "Booked them for my sister's wedding. The whole team was fast and the designs were unique.",
  "Very neat and clean work. The color came out so dark the next day!",
  "Professional, punctual, and perfect designs. What more could you ask for?",
  "The booking process was so easy, and the artist was very friendly. Loved the floral Arabic design.",
  "Such a premium service! The artists wear uniform and use high-quality organic cones.",
  "My bridal mehndi looked exactly like the Pinterest reference photo I showed them.",
  "Fantastic service! Will definitely book again for the next festival.",
  "The stain lasted for more than a week without fading much. Great quality henna.",
  "Worth every penny. The team handled a crowd of 20 ladies very efficiently.",
  "Beautiful traditional designs. My mother absolutely loved her mehndi.",
  "I was worried about my sensitive skin, but their organic henna caused no issues at all.",
  "They are my go-to mehndi artists now. Always perfect.",
  "The 3D figures in the bridal mehndi were mind-blowing. True artistry!"
];

const events = ["engagement", "wedding", "party", "karwa chauth", "teej", "baby shower"];

const generateReviews = (count) => {
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const event = events[Math.floor(Math.random() * events.length)];
    
    let text = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
    text = text.replace("{role}", role.toLowerCase());
    text = text.replace("{area}", area);
    text = text.replace("{event}", event);

    // Bias towards 5 stars
    const ratingOptions = [5, 5, 5, 5, 5, 5, 5, 4, 4, 3];
    const rating = ratingOptions[Math.floor(Math.random() * ratingOptions.length)];

    reviews.push({
      id: `seed_${i}`,
      name: `${firstName} ${lastName}`,
      role: role,
      text: text,
      area: area,
      rating: rating,
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString() // Random date in the past
    });
  }
  return reviews;
};

const reviews = generateReviews(500);

// Ensure the data directory exists
if (!fs.existsSync('./data')){
    fs.mkdirSync('./data');
}

fs.writeFileSync('./data/reviews.json', JSON.stringify(reviews, null, 2));
console.log('Successfully generated 500 reviews in data/reviews.json');
