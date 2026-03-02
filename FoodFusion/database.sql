--
-- Database: `foodfusion_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `Users`
-- Stores user account information.
--
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table `Categories`
-- Stores recipe categories for filtering (e.g., Italian, Vegan, Beginner).
--
CREATE TABLE Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- --------------------------------------------------------

--
-- Table structure for table `Recipes`
-- Stores all recipe details. `user_id` is a foreign key to the Users table.
-- It can be NULL for official site recipes.
--
CREATE TABLE Recipes (
    recipe_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(2048),
    skill_level VARCHAR(50),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- --------------------------------------------------------

--
-- Table structure for table `Recipe_Categories`
-- Junction table for the many-to-many relationship between Recipes and Categories.
--
CREATE TABLE Recipe_Categories (
    recipe_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (recipe_id, category_id),
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE
);

-- --------------------------------------------------------

--
-- Table structure for table `Events`
-- Stores information about upcoming cooking events and workshops.
--
CREATE TABLE Events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(2048),
    event_date DATETIME NOT NULL,
    host_name VARCHAR(100)
);

-- --------------------------------------------------------

--
-- Table structure for table `TeamMembers`
-- Stores information about the FoodFusion team members.
--
CREATE TABLE TeamMembers (
    team_member_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    image_url VARCHAR(2048)
);

-- --------------------------------------------------------

--
-- Table structure for table `Resources`
-- Stores educational content and downloadable resources.
-- `resource_type` can be 'Infographic', 'Video', 'Guide', 'Printable', etc.
--
CREATE TABLE Resources (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(2048),
    resource_type VARCHAR(50),
    resource_link VARCHAR(2048)
);

-- --------------------------------------------------------

--
-- Table structure for table `ContactMessages`
-- Stores messages submitted via the contact form.
--
CREATE TABLE ContactMessages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--
-- Populating the `foodfusion_db` database
--

-- --------------------------------------------------------
-- 1. Insert Sample Users
-- A user for the community recipe and a couple of other generic users.
-- Note: Passwords should be properly hashed in a real application.
-- --------------------------------------------------------
INSERT INTO Users (first_name, last_name, email, password_hash) VALUES
('John', 'S.', 'john.s@example.com', 'hashed_password_placeholder_1'),
('Alice', 'Williams', 'alice.w@example.com', 'hashed_password_placeholder_2'),
('Bob', 'Johnson', 'bob.j@example.com', 'hashed_password_placeholder_3');


-- --------------------------------------------------------
-- 2. Insert Recipe Categories
-- Based on the filter bar on recipes.html and tags on other pages.
-- --------------------------------------------------------
INSERT INTO Categories (category_name) VALUES
('Italian'),
('Mexican'),
('Asian'),
('Vegan'),
('Beginner'),
('American'),
('Intermediate');


-- --------------------------------------------------------
-- 3. Insert Recipes
-- Includes featured recipes, recipe collection, and the community recipe.
-- The user_id for the community recipe is set to 1 (John S.).
-- Official site recipes have a NULL user_id.
-- --------------------------------------------------------
INSERT INTO Recipes (title, description, image_url, skill_level, is_featured, user_id) VALUES
-- Featured Recipes from index.html (is_featured = TRUE)
('Rustic Spicy Tomato Pasta', 'A classic Italian dish with a fiery twist. Perfect for a quick, flavorful weeknight dinner that will impress everyone.', 'https://images.unsplash.com/photo-1598866594240-a_2e82583d34?q=80&w=1974&auto=format&fit=crop', 'Beginner', TRUE, NULL),
('Family-Friendly Homemade Pizza', 'Get the whole family involved in making delicious, crispy-crust pizza from scratch. Fun to make and even better to eat!', 'https://images.unsplash.com/photo-1604382354936-07c5d9983d34?q=80&w=2070&auto=format&fit=crop', 'Beginner', TRUE, NULL),

-- Recipes from recipes.html
('Classic Margherita Pizza', 'A timeless classic with fresh basil, mozzarella, and a rich tomato sauce on a perfectly crisp crust.', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop', 'Beginner', FALSE, NULL),
('Fluffy American Pancakes', 'Start your day right with these light, fluffy pancakes drizzled with maple syrup and topped with fresh berries.', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1980&auto=format&fit=crop', 'Beginner', FALSE, NULL),
('Vibrant Vegan Buddha Bowl', 'A healthy and colorful bowl packed with quinoa, roasted vegetables, and a creamy tahini dressing.', 'https://images.unsplash.com/photo-1631292784024-76b3a5a5a5a5?q=80&w=1974&auto=format&fit=crop', 'Intermediate', FALSE, NULL),

-- Community Recipe from community.html (user_id = 1 for John S.)
('Grandma''s "Famous" Chocolate Cake', 'This recipe has been in my family for generations. It''s incredibly moist and rich. Hope you love it!', 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=1950&auto=format&fit=crop', 'Beginner', FALSE, 1);


-- --------------------------------------------------------
-- 4. Link Recipes to Categories (Recipe_Categories junction table)
-- Mapping based on assumed IDs (Recipes: 1-6, Categories: 1-7).
-- --------------------------------------------------------
INSERT INTO Recipe_Categories (recipe_id, category_id) VALUES
-- Rustic Spicy Tomato Pasta (ID 1) -> Italian (ID 1), Beginner (ID 5)
(1, 1),
(1, 5),

-- Family-Friendly Homemade Pizza (ID 2) -> Italian (ID 1), Beginner (ID 5)
(2, 1),
(2, 5),

-- Classic Margherita Pizza (ID 3) -> Italian (ID 1), Beginner (ID 5)
(3, 1),
(3, 5),

-- Fluffy American Pancakes (ID 4) -> American (ID 6), Beginner (ID 5)
(4, 6),
(4, 5),

-- Vibrant Vegan Buddha Bowl (ID 5) -> Vegan (ID 4), Intermediate (ID 7)
(5, 4),
(5, 7),

-- Grandma's "Famous" Chocolate Cake (ID 6) -> Beginner (ID 5)
(6, 5);


-- --------------------------------------------------------
-- 5. Insert Upcoming Events
-- From the carousel on index.html.
-- --------------------------------------------------------
INSERT INTO Events (title, description, image_url, event_date, host_name) VALUES
('Live Workshop: The Art of Fresh Pasta', 'Join Chef Isabella Rossi live as she teaches you the traditional Italian art of making fresh pasta from scratch. Limited spots available!', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1935&auto=format&fit=crop', '2023-11-25 18:00:00', 'Chef Isabella Rossi'),
('Virtual Class: Sushi Rolling 101', 'Master the basics of sushi rolling in this fun and interactive virtual class. We''ll send you a kit with everything you need!', 'https://images.unsplash.com/photo-1556910110-a5a6370d35cd?q=80&w=2070&auto=format&fit=crop', '2023-12-05 19:00:00', NULL);


-- --------------------------------------------------------
-- 6. Insert Team Members
-- From about.html.
-- --------------------------------------------------------
INSERT INTO TeamMembers (name, role, image_url) VALUES
('Jane Doe', 'Founder & Head Chef', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop'),
('John Smith', 'Head of Community', 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=2071&auto=format&fit=crop'),
('Emily White', 'Lead Food Stylist', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop');


-- --------------------------------------------------------
-- 7. Insert Resources
-- From resources.html and education.html.
-- We also add the 'Avocado Toast' trend from the homepage here.
-- --------------------------------------------------------
INSERT INTO Resources (title, description, image_url, resource_type, resource_link) VALUES
-- From index.html
('Trend: The Ultimate Avocado Toast', 'Discover the secrets to creating the perfect avocado toast, from picking the right avocado to unique topping ideas.', 'https://images.unsplash.com/photo-1625944228743-47a3a88639e6?q=80&w=1964&auto=format&fit=crop', 'Guide', '/trends/avocado-toast'),
-- From resources.html
('Printable Recipe Cards', 'Download beautifully designed, easy-to-read recipe cards for your favorite FoodFusion meals.', 'https://images.unsplash.com/photo-1621996346565-e326e20f547c?q=80&w=1965&auto=format&fit=crop', 'Printable', '/downloads/recipe-cards.pdf'),
('Video: Essential Knife Skills', 'Learn the fundamental knife cuts that will make your prep work faster, safer, and more professional.', 'https://images.unsplash.com/photo-1496116218417-1a76417c9173?q=80&w=2070&auto=format&fit=crop', 'Video', '/videos/knife-skills'),
('Guide: 10 Kitchen Hacks', 'A downloadable PDF with 10 time-saving kitchen hacks that every home cook should know.', 'https://images.unsplash.com/photo-1556909172-6ab63f18fd12?q=80&w=2070&auto=format&fit=crop', 'Guide', '/downloads/kitchen-hacks.pdf'),
-- From education.html
('Infographic: The Macronutrients', 'A clear, visual guide to understanding proteins, fats, and carbohydrates and their role in a balanced diet.', 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=2070&auto=format&fit=crop', 'Infographic', '/education/macronutrients'),
('Video: The Guide to Sustainable Eating', 'Learn how to make more environmentally friendly choices in the kitchen, from reducing food waste to shopping local.', 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=80&w=1974&auto=format&fit=crop', 'Video', '/videos/sustainable-eating'),
('Guide: The Science of Flavor', 'Explore the Maillard reaction, caramelization, and other chemical processes that create delicious flavors.', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1948&auto=format&fit=crop', 'Guide', '/education/science-of-flavor');


-- --------------------------------------------------------
-- 8. Insert a Sample Contact Message
-- To demonstrate the functionality of the ContactMessages table.
-- --------------------------------------------------------
INSERT INTO ContactMessages (name, email, message) VALUES
('Maria Garcia', 'm.garcia@email.com', 'I absolutely love the spicy tomato pasta recipe! Do you have any suggestions for a good side dish to go with it? Thanks!');