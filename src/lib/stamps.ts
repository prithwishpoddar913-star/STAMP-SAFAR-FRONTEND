const stampImages = Array.from(
  { length: 160 },
  (_, i) => `/stamps/stamp${i + 1}.jpeg`
);

const sellers = [
  { name: "Dak Heritage Co.", location: "New Delhi", rating: 4.8 },
  { name: "Classic Philately", location: "Mumbai", rating: 4.7 },
  { name: "Bharat Stamp House", location: "Kolkata", rating: 4.9 },
  { name: "Collector's Desk", location: "Bengaluru", rating: 4.6 },
];

const baseStamps = [
  {
    name: "Mahatma Gandhi Stamp",
    category: "History",
    state: "Delhi",
    city: "New Delhi",
    description: "Mahatma Gandhi freedom fighter stamp.",
  },

  {
    name: "Netaji Subhas Bose Stamp",
    category: "History",
    state: "West Bengal",
    city: "Kolkata",
    description: "Netaji Subhas Chandra Bose commemorative stamp.",
  },

  {
    name: "Bhagat Singh Stamp",
    category: "History",
    state: "Punjab",
    city: "Amritsar",
    description: "Bhagat Singh freedom fighter stamp.",
  },

  {
    name: "Rani Lakshmi Bai Stamp",
    category: "History",
    state: "Uttar Pradesh",
    city: "Jhansi",
    description: "Rani Lakshmi Bai warrior queen stamp.",
  },

  {
    name: "Rabindranath Tagore Stamp",
    category: "History",
    state: "West Bengal",
    city: "Kolkata",
    description: "Rabindranath Tagore heritage stamp.",
  },

  {
    name: "Swami Vivekananda Stamp",
    category: "History",
    state: "West Bengal",
    city: "Kolkata",
    description: "Swami Vivekananda commemorative stamp.",
  },

  {
    name: "Independence 1947 Stamp",
    category: "History",
    state: "Delhi",
    city: "New Delhi",
    description: "Indian Independence memorial stamp.",
  },

  {
    name: "Dandi March Stamp",
    category: "History",
    state: "Gujarat",
    city: "Dandi",
    description: "Dandi March freedom movement stamp.",
  },

  {
    name: "Indian Constitution Stamp",
    category: "History",
    state: "Delhi",
    city: "New Delhi",
    description: "Indian Constitution commemorative stamp.",
  },

  {
    name: "Sardar Patel Stamp",
    category: "History",
    state: "Gujarat",
    city: "Ahmedabad",
    description: "Sardar Vallabhbhai Patel stamp.",
  },

  {
    name: "Dr APJ Abdul Kalam Stamp",
    category: "History",
    state: "Tamil Nadu",
    city: "Rameswaram",
    description: "Dr APJ Abdul Kalam stamp.",
  },

  {
    name: "Jawaharlal Nehru Stamp",
    category: "History",
    state: "Uttar Pradesh",
    city: "Allahabad",
    description: "Jawaharlal Nehru stamp.",
  },

  {
    name: "Shivaji Maharaj Stamp",
    category: "History",
    state: "Maharashtra",
    city: "Pune",
    description: "Chhatrapati Shivaji Maharaj stamp.",
  },

  {
    name: "Ashoka Stamp",
    category: "History",
    state: "Bihar",
    city: "Patna",
    description: "Emperor Ashoka stamp.",
  },

  {
    name: "Harappa Civilization Stamp",
    category: "History",
    state: "Punjab",
    city: "Harappa",
    description: "Harappa Civilization stamp.",
  },

  {
    name: "Chandragupta Maurya Stamp",
    category: "History",
    state: "Bihar",
    city: "Patna",
    description: "Chandragupta Maurya stamp.",
  },

  {
    name: "Mughal Era Stamp",
    category: "History",
    state: "Uttar Pradesh",
    city: "Agra",
    description: "Mughal Era stamp.",
  },

  {
    name: "Freedom Fighters Stamp",
    category: "History",
    state: "India",
    city: "Delhi",
    description: "Freedom Fighters commemorative stamp.",
  },

  {
    name: "Quit India Movement Stamp",
    category: "History",
    state: "Maharashtra",
    city: "Mumbai",
    description: "Quit India Movement stamp.",
  },

  {
    name: "Indian Rail History Stamp",
    category: "History",
    state: "West Bengal",
    city: "Kolkata",
    description: "Indian Rail History stamp.",
  },

  // ================= WILDLIFE =================
  // ================= WILDLIFE =================

{
  name: "Royal Bengal Tiger Stamp",
  category: "Wildlife",
  state: "West Bengal",
  city: "Sundarbans",
  description: "Royal Bengal Tiger wildlife stamp.",
},

{
  name: "Asiatic Lion Stamp",
  category: "Wildlife",
  state: "Gujarat",
  city: "Gir",
  description: "Asiatic Lion wildlife stamp.",
},

{
  name: "Indian Elephant Stamp",
  category: "Wildlife",
  state: "Kerala",
  city: "Wayanad",
  description: "Indian Elephant wildlife stamp.",
},

{
  name: "Red Panda Stamp",
  category: "Wildlife",
  state: "Sikkim",
  city: "Gangtok",
  description: "Red Panda wildlife stamp.",
},

{
  name: "Snow Leopard Stamp",
  category: "Wildlife",
  state: "Ladakh",
  city: "Leh",
  description: "Snow Leopard wildlife stamp.",
},

{
  name: "Peacock Stamp",
  category: "Wildlife",
  state: "India",
  city: "National",
  description: "Peacock wildlife stamp.",
},

{
  name: "Black Buck Stamp",
  category: "Wildlife",
  state: "Rajasthan",
  city: "Jodhpur",
  description: "Black Buck wildlife stamp.",
},

{
  name: "Rhino Stamp",
  category: "Wildlife",
  state: "Assam",
  city: "Kaziranga",
  description: "Rhino wildlife stamp.",
},

{
  name: "King Cobra Stamp",
  category: "Wildlife",
  state: "Kerala",
  city: "Western Ghats",
  description: "King Cobra wildlife stamp.",
},

{
  name: "Ganges Dolphin Stamp",
  category: "Wildlife",
  state: "Uttar Pradesh",
  city: "Varanasi",
  description: "Ganges Dolphin stamp.",
},

{
  name: "Himalayan Monal Stamp",
  category: "Wildlife",
  state: "Uttarakhand",
  city: "Chamoli",
  description: "Himalayan Monal stamp.",
},

{
  name: "Nilgiri Tahr Stamp",
  category: "Wildlife",
  state: "Tamil Nadu",
  city: "Nilgiris",
  description: "Nilgiri Tahr stamp.",
},

{
  name: "Indian Bison Stamp",
  category: "Wildlife",
  state: "Karnataka",
  city: "Bandipur",
  description: "Indian Bison stamp.",
},

{
  name: "Crocodile Stamp",
  category: "Wildlife",
  state: "Odisha",
  city: "Bhitarkanika",
  description: "Crocodile stamp.",
},

{
  name: "Olive Ridley Turtle Stamp",
  category: "Wildlife",
  state: "Odisha",
  city: "Rushikulya",
  description: "Olive Ridley Turtle stamp.",
},

{
  name: "Sarus Crane Stamp",
  category: "Wildlife",
  state: "Uttar Pradesh",
  city: "Etawah",
  description: "Sarus Crane stamp.",
},

{
  name: "Great Indian Bustard Stamp",
  category: "Wildlife",
  state: "Rajasthan",
  city: "Desert",
  description: "Great Indian Bustard stamp.",
},

{
  name: "Leopard Stamp",
  category: "Wildlife",
  state: "Maharashtra",
  city: "Sahyadri",
  description: "Leopard stamp.",
},

{
  name: "Deer Species Stamp",
  category: "Wildlife",
  state: "India",
  city: "Various",
  description: "Deer Species stamp.",
},

{
  name: "National Parks Stamp",
  category: "Wildlife",
  state: "India",
  city: "Various",
  description: "National Parks stamp.",
},

  // ================= FESTIVALS =================
  
{
  name: "Durga Puja Stamp",
  category: "Festivals",
  state: "West Bengal",
  city: "Kolkata",
  description: "Durga Puja festival stamp.",
},

{
  name: "Diwali Stamp",
  category: "Festivals",
  state: "Delhi",
  city: "New Delhi",
  description: "Diwali festival stamp.",
},

{
  name: "Holi Stamp",
  category: "Festivals",
  state: "Uttar Pradesh",
  city: "Mathura",
  description: "Holi festival stamp.",
},

{
  name: "Eid Stamp",
  category: "Festivals",
  state: "Telangana",
  city: "Hyderabad",
  description: "Eid celebration stamp.",
},

{
  name: "Christmas Stamp",
  category: "Festivals",
  state: "Goa",
  city: "Panaji",
  description: "Christmas celebration stamp.",
},

{
  name: "Raksha Bandhan Stamp",
  category: "Festivals",
  state: "Rajasthan",
  city: "Jaipur",
  description: "Raksha Bandhan stamp.",
},

{
  name: "Pongal Stamp",
  category: "Festivals",
  state: "Tamil Nadu",
  city: "Chennai",
  description: "Pongal festival stamp.",
},

{
  name: "Onam Stamp",
  category: "Festivals",
  state: "Kerala",
  city: "Kochi",
  description: "Onam festival stamp.",
},

{
  name: "Baisakhi Stamp",
  category: "Festivals",
  state: "Punjab",
  city: "Amritsar",
  description: "Baisakhi festival stamp.",
},

{
  name: "Navratri Stamp",
  category: "Festivals",
  state: "Gujarat",
  city: "Ahmedabad",
  description: "Navratri stamp.",
},

{
  name: "Ganesh Chaturthi Stamp",
  category: "Festivals",
  state: "Maharashtra",
  city: "Mumbai",
  description: "Ganesh Chaturthi stamp.",
},

{
  name: "Chhath Puja Stamp",
  category: "Festivals",
  state: "Bihar",
  city: "Patna",
  description: "Chhath Puja stamp.",
},

{
  name: "Janmashtami Stamp",
  category: "Festivals",
  state: "Uttar Pradesh",
  city: "Vrindavan",
  description: "Janmashtami stamp.",
},

{
  name: "Saraswati Puja Stamp",
  category: "Festivals",
  state: "West Bengal",
  city: "Kolkata",
  description: "Saraswati Puja stamp.",
},

{
  name: "Buddha Purnima Stamp",
  category: "Festivals",
  state: "Bihar",
  city: "Bodh Gaya",
  description: "Buddha Purnima stamp.",
},

{
  name: "Rath Yatra Stamp",
  category: "Festivals",
  state: "Odisha",
  city: "Puri",
  description: "Rath Yatra stamp.",
},

{
  name: "Kumbh Mela Stamp",
  category: "Festivals",
  state: "Uttar Pradesh",
  city: "Prayagraj",
  description: "Kumbh Mela stamp.",
},

{
  name: "Lohri Stamp",
  category: "Festivals",
  state: "Punjab",
  city: "Ludhiana",
  description: "Lohri stamp.",
},

{
  name: "Vishu Stamp",
  category: "Festivals",
  state: "Kerala",
  city: "Kochi",
  description: "Vishu stamp.",
},

{
  name: "Makar Sankranti Stamp",
  category: "Festivals",
  state: "India",
  city: "Various",
  description: "Makar Sankranti stamp.",
},
  // ================= MONUMENTS =================
  

{
  name: "Taj Mahal Stamp",
  category: "Monuments",
  state: "Uttar Pradesh",
  city: "Agra",
  description: "Taj Mahal monument stamp.",
},

{
  name: "Victoria Memorial Stamp",
  category: "Monuments",
  state: "West Bengal",
  city: "Kolkata",
  description: "Victoria Memorial monument stamp.",
},

{
  name: "India Gate Stamp",
  category: "Monuments",
  state: "Delhi",
  city: "New Delhi",
  description: "India Gate monument stamp.",
},

{
  name: "Qutub Minar Stamp",
  category: "Monuments",
  state: "Delhi",
  city: "New Delhi",
  description: "Qutub Minar heritage stamp.",
},

{
  name: "Red Fort Stamp",
  category: "Monuments",
  state: "Delhi",
  city: "New Delhi",
  description: "Historic Red Fort stamp.",
},

{
  name: "Konark Temple Stamp",
  category: "Monuments",
  state: "Odisha",
  city: "Konark",
  description: "Konark Sun Temple stamp.",
},

{
  name: "Ajanta Caves Stamp",
  category: "Monuments",
  state: "Maharashtra",
  city: "Aurangabad",
  description: "Ajanta Caves stamp.",
},

{
  name: "Ellora Caves Stamp",
  category: "Monuments",
  state: "Maharashtra",
  city: "Aurangabad",
  description: "Ellora Caves stamp.",
},

{
  name: "Howrah Bridge Stamp",
  category: "Monuments",
  state: "West Bengal",
  city: "Kolkata",
  description: "Howrah Bridge stamp.",
},

{
  name: "Gateway of India Stamp",
  category: "Monuments",
  state: "Maharashtra",
  city: "Mumbai",
  description: "Gateway of India stamp.",
},

{
  name: "Hampi Stamp",
  category: "Monuments",
  state: "Karnataka",
  city: "Hampi",
  description: "Hampi heritage stamp.",
},

{
  name: "Charminar Stamp",
  category: "Monuments",
  state: "Telangana",
  city: "Hyderabad",
  description: "Charminar stamp.",
},

{
  name: "Sanchi Stupa Stamp",
  category: "Monuments",
  state: "Madhya Pradesh",
  city: "Sanchi",
  description: "Sanchi Stupa stamp.",
},

{
  name: "Lotus Temple Stamp",
  category: "Monuments",
  state: "Delhi",
  city: "New Delhi",
  description: "Lotus Temple stamp.",
},

{
  name: "Golden Temple Stamp",
  category: "Monuments",
  state: "Punjab",
  city: "Amritsar",
  description: "Golden Temple stamp.",
},

{
  name: "Mysore Palace Stamp",
  category: "Monuments",
  state: "Karnataka",
  city: "Mysuru",
  description: "Mysore Palace stamp.",
},

{
  name: "Sun Temple Stamp",
  category: "Monuments",
  state: "Odisha",
  city: "Konark",
  description: "Sun Temple stamp.",
},

{
  name: "Nalanda Stamp",
  category: "Monuments",
  state: "Bihar",
  city: "Nalanda",
  description: "Nalanda heritage stamp.",
},

{
  name: "Brihadeeswara Temple Stamp",
  category: "Monuments",
  state: "Tamil Nadu",
  city: "Thanjavur",
  description: "Brihadeeswara Temple stamp.",
},

{
  name: "Jantar Mantar Stamp",
  category: "Monuments",
  state: "Rajasthan",
  city: "Jaipur",
  description: "Jantar Mantar stamp.",
},
  // ================= MILITARY =================
  
{
  name: "Indian Army Stamp",
  category: "Military",
  state: "Delhi",
  city: "New Delhi",
  description: "Indian Army commemorative stamp.",
},

{
  name: "Indian Navy Stamp",
  category: "Military",
  state: "Maharashtra",
  city: "Mumbai",
  description: "Indian Navy stamp.",
},

{
  name: "Indian Air Force Stamp",
  category: "Military",
  state: "Karnataka",
  city: "Bengaluru",
  description: "Indian Air Force stamp.",
},

{
  name: "Kargil War Stamp",
  category: "Military",
  state: "Ladakh",
  city: "Kargil",
  description: "Kargil War memorial stamp.",
},

{
  name: "Param Vir Chakra Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Param Vir Chakra award stamp.",
},

{
  name: "INS Vikrant Stamp",
  category: "Military",
  state: "Kerala",
  city: "Kochi",
  description: "INS Vikrant naval stamp.",
},

{
  name: "Sukhoi Fighter Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Sukhoi Fighter aircraft stamp.",
},

{
  name: "Tejas Aircraft Stamp",
  category: "Military",
  state: "Karnataka",
  city: "Bengaluru",
  description: "Tejas Aircraft stamp.",
},

{
  name: "DRDO Stamp",
  category: "Military",
  state: "Delhi",
  city: "New Delhi",
  description: "DRDO defence research stamp.",
},

{
  name: "BSF Stamp",
  category: "Military",
  state: "India",
  city: "Border",
  description: "Border Security Force stamp.",
},

{
  name: "CRPF Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Central Reserve Police Force stamp.",
},

{
  name: "Military Medals Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Indian Military Medals stamp.",
},

{
  name: "Submarine Fleet Stamp",
  category: "Military",
  state: "India",
  city: "Naval",
  description: "Indian Submarine Fleet stamp.",
},

{
  name: "Missile Program Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Indian Missile Program stamp.",
},

{
  name: "Agni Missile Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Agni Missile stamp.",
},

{
  name: "BrahMos Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "BrahMos missile stamp.",
},

{
  name: "Tank Regiment Stamp",
  category: "Military",
  state: "India",
  city: "Army",
  description: "Tank Regiment stamp.",
},

{
  name: "Border Security Stamp",
  category: "Military",
  state: "India",
  city: "Border",
  description: "Border Security stamp.",
},

{
  name: "Army Day Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Army Day celebration stamp.",
},

{
  name: "Vijay Diwas Stamp",
  category: "Military",
  state: "India",
  city: "National",
  description: "Vijay Diwas commemorative stamp.",
},
  // ================= SCIENCE =================
{
  name: "ISRO Stamp",
  category: "Science",
  state: "Karnataka",
  city: "Bengaluru",
  description: "ISRO commemorative stamp.",
},

{
  name: "Chandrayaan Stamp",
  category: "Science",
  state: "Karnataka",
  city: "Bengaluru",
  description: "Chandrayaan moon mission stamp.",
},

{
  name: "Mangalyaan Stamp",
  category: "Science",
  state: "Karnataka",
  city: "Bengaluru",
  description: "Mars Orbiter Mission stamp.",
},

{
  name: "Vikram Sarabhai Stamp",
  category: "Science",
  state: "Gujarat",
  city: "Ahmedabad",
  description: "Vikram Sarabhai stamp.",
},

{
  name: "APJ Abdul Kalam Stamp",
  category: "Science",
  state: "Tamil Nadu",
  city: "Rameswaram",
  description: "APJ Abdul Kalam stamp.",
},

{
  name: "Raman Effect Stamp",
  category: "Science",
  state: "Tamil Nadu",
  city: "Chennai",
  description: "Raman Effect discovery stamp.",
},

{
  name: "Aryabhata Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Aryabhata satellite stamp.",
},

{
  name: "Chandrasekhar Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Chandrasekhar contribution stamp.",
},

{
  name: "Indian Satellites Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Indian Satellites stamp.",
},

{
  name: "GSLV Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "GSLV launch vehicle stamp.",
},

{
  name: "PSLV Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "PSLV mission stamp.",
},

{
  name: "Green Revolution Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Green Revolution stamp.",
},

{
  name: "Digital India Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Digital India mission stamp.",
},

{
  name: "Supercomputers Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Supercomputers development stamp.",
},

{
  name: "Nuclear Energy Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Nuclear Energy stamp.",
},

{
  name: "Biotechnology Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Biotechnology stamp.",
},

{
  name: "AI Mission India Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "AI Mission India stamp.",
},

{
  name: "Space Missions Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Space Missions stamp.",
},

{
  name: "Indian Mathematics Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Indian Mathematics stamp.",
},

{
  name: "Medical Science Stamp",
  category: "Science",
  state: "India",
  city: "National",
  description: "Medical Science stamp.",
},

  // ================= CULTURE =================
  
{
  name: "Bharatanatyam Stamp",
  category: "Culture",
  state: "Tamil Nadu",
  city: "Chennai",
  description: "Bharatanatyam classical dance stamp.",
},

{
  name: "Kathak Stamp",
  category: "Culture",
  state: "Uttar Pradesh",
  city: "Lucknow",
  description: "Kathak dance heritage stamp.",
},

{
  name: "Baul Stamp",
  category: "Culture",
  state: "West Bengal",
  city: "Birbhum",
  description: "Baul folk culture stamp.",
},

{
  name: "Rabindra Sangeet Stamp",
  category: "Culture",
  state: "West Bengal",
  city: "Kolkata",
  description: "Rabindra Sangeet cultural stamp.",
},

{
  name: "Yoga Stamp",
  category: "Culture",
  state: "Uttarakhand",
  city: "Rishikesh",
  description: "Yoga heritage stamp.",
},

{
  name: "Ayurveda Stamp",
  category: "Culture",
  state: "Kerala",
  city: "Kochi",
  description: "Ayurveda traditional medicine stamp.",
},

{
  name: "Classical Music Stamp",
  category: "Culture",
  state: "India",
  city: "National",
  description: "Indian classical music stamp.",
},

{
  name: "Sitar Stamp",
  category: "Culture",
  state: "India",
  city: "National",
  description: "Sitar instrument stamp.",
},

{
  name: "Tabla Stamp",
  category: "Culture",
  state: "India",
  city: "National",
  description: "Tabla instrument stamp.",
},

{
  name: "Indian Cinema Stamp",
  category: "Culture",
  state: "India",
  city: "Mumbai",
  description: "Indian cinema stamp.",
},

{
  name: "Bollywood Stamp",
  category: "Culture",
  state: "Maharashtra",
  city: "Mumbai",
  description: "Bollywood film industry stamp.",
},

{
  name: "Folk Dance Stamp",
  category: "Culture",
  state: "India",
  city: "Various",
  description: "Indian folk dance stamp.",
},

{
  name: "Tribal Art Stamp",
  category: "Culture",
  state: "India",
  city: "Various",
  description: "Tribal art stamp.",
},

{
  name: "Saree Culture Stamp",
  category: "Culture",
  state: "India",
  city: "Various",
  description: "Saree culture stamp.",
},

{
  name: "Handicrafts Stamp",
  category: "Culture",
  state: "India",
  city: "Various",
  description: "Handicrafts stamp.",
},

{
  name: "Bengali Culture Stamp",
  category: "Culture",
  state: "West Bengal",
  city: "Kolkata",
  description: "Bengali culture stamp.",
},

{
  name: "Punjabi Culture Stamp",
  category: "Culture",
  state: "Punjab",
  city: "Amritsar",
  description: "Punjabi culture stamp.",
},

{
  name: "Tamil Heritage Stamp",
  category: "Culture",
  state: "Tamil Nadu",
  city: "Chennai",
  description: "Tamil heritage stamp.",
},

{
  name: "Sanskrit Stamp",
  category: "Culture",
  state: "India",
  city: "Ancient",
  description: "Sanskrit language stamp.",
},

{
  name: "Traditional Art Stamp",
  category: "Culture",
  state: "India",
  city: "Various",
  description: "Traditional Indian art stamp.",
},
  // ================= TRANSPORT =================
  
{
  name: "Indian Railways Stamp",
  category: "Transport",
  state: "India",
  city: "Delhi",
  description: "Indian Railways transport stamp.",
},

{
  name: "Vande Bharat Stamp",
  category: "Transport",
  state: "India",
  city: "Delhi",
  description: "Vande Bharat Express train stamp.",
},

{
  name: "Steam Engine Stamp",
  category: "Transport",
  state: "West Bengal",
  city: "Kolkata",
  description: "Steam Engine heritage stamp.",
},

{
  name: "Kolkata Tram Stamp",
  category: "Transport",
  state: "West Bengal",
  city: "Kolkata",
  description: "Kolkata Tram stamp.",
},

{
  name: "Metro Rail Stamp",
  category: "Transport",
  state: "Delhi",
  city: "New Delhi",
  description: "Metro Rail stamp.",
},

{
  name: "Air India Stamp",
  category: "Transport",
  state: "Maharashtra",
  city: "Mumbai",
  description: "Air India aviation stamp.",
},

{
  name: "Shipping Stamp",
  category: "Transport",
  state: "India",
  city: "Ports",
  description: "Shipping transport stamp.",
},

{
  name: "Ports Stamp",
  category: "Transport",
  state: "India",
  city: "Various",
  description: "Indian ports stamp.",
},

{
  name: "Bicycle Stamp",
  category: "Transport",
  state: "India",
  city: "National",
  description: "Bicycle transport stamp.",
},

{
  name: "Auto Rickshaw Stamp",
  category: "Transport",
  state: "India",
  city: "Various",
  description: "Auto Rickshaw stamp.",
},

{
  name: "Ambassador Car Stamp",
  category: "Transport",
  state: "India",
  city: "National",
  description: "Ambassador Car stamp.",
},

{
  name: "Bullet Train Stamp",
  category: "Transport",
  state: "India",
  city: "Mumbai",
  description: "Bullet Train project stamp.",
},

{
  name: "Electric Vehicles Stamp",
  category: "Transport",
  state: "India",
  city: "National",
  description: "Electric Vehicles stamp.",
},

{
  name: "Highways Stamp",
  category: "Transport",
  state: "India",
  city: "National",
  description: "Highways development stamp.",
},

{
  name: "Bridges Stamp",
  category: "Transport",
  state: "India",
  city: "Various",
  description: "Bridges infrastructure stamp.",
},

{
  name: "Aviation Stamp",
  category: "Transport",
  state: "India",
  city: "National",
  description: "Aviation stamp.",
},

{
  name: "Helicopters Stamp",
  category: "Transport",
  state: "India",
  city: "National",
  description: "Helicopters stamp.",
},

{
  name: "Airports Stamp",
  category: "Transport",
  state: "India",
  city: "Various",
  description: "Airports stamp.",
},

{
  name: "River Transport Stamp",
  category: "Transport",
  state: "India",
  city: "Various",
  description: "River transport stamp.",
},

{
  name: "Mountain Railways Stamp",
  category: "Transport",
  state: "India",
  city: "Hill Stations",
  description: "Mountain railways stamp.",
},
];
const prices = Array.from({ length: 100 }, (_, i) =>
  (i % 100) + 1
);

const rarities = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
];

export const stamps = Array.from({ length: 160 }, (_, i) => {
  const base = baseStamps[i % baseStamps.length];

  return {
    id: `${i + 1}`,

    name: `${base.name} ${Math.floor(i / baseStamps.length) + 1}`,

    year: 1950 + (i % 75),

    price: prices[i % prices.length],

    category: base.category,

    rarity: rarities[i % rarities.length],

    image: stampImages[i % stampImages.length],

    description: `${base.description} 📍 ${base.city}, ${base.state}, India`,

    available: i % 5 !== 0,

    origin: "India",

    state: base.state,

    city: base.city,

    rarityScore: 70 + (i % 30),

    condition: [
      "Mint never hinged",
      "Mint hinged",
      "Fine used",
      "Very fine used",
    ][i % 4],

    stock: 1 + (i % 8),

    seller: sellers[i % sellers.length],
  };
});

export type Stamp = (typeof stamps)[number];

export function getStamp(id: string) {
  return stamps.find((stamp) => stamp.id === id);
}