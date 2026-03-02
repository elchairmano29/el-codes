// FoodFusion Recipe Management JavaScript
// Handles recipe display, filtering, and interactions

class RecipeManager {
    constructor() {
        this.currentPage = 1;
        this.recipesPerPage = 12;
        this.currentFilters = {};
        this.recipes = [];
        this.init();
    }

    init() {
        this.setupFilterControls();
        this.setupSearchFunctionality();
        this.setupSortControls();
        this.loadRecipes();
    }

    setupFilterControls() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                const filterValue = e.target.dataset.value;
                
                // Toggle active state
                const isActive = e.target.classList.contains('active');
                
                // Clear other filters of same type
                document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(b => {
                    b.classList.remove('active');
                });
                
                if (!isActive) {
                    e.target.classList.add('active');
                    this.currentFilters[filterType] = filterValue;
                } else {
                    delete this.currentFilters[filterType];
                }
                
                this.currentPage = 1;
                this.loadRecipes();
            });
        });

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('recipeSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value.trim();
                    this.currentPage = 1;
                    this.loadRecipes();
                }, 500);
            });
        }
    }

    setupSortControls() {
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.currentPage = 1;
                this.loadRecipes();
            });
        }
    }

    async loadRecipes() {
        try {
            this.showLoading();
            
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.recipesPerPage,
                ...this.currentFilters
            });

            const response = await fetch(`http://localhost:8000/api/recipes/list?${queryParams}`);
            const data = await response.json();

            if (response.ok && data.success) {
                this.recipes = data.data.recipes;
                this.displayRecipes(this.recipes);
                this.displayPagination(data.data.pagination);
            } else {
                this.showError('Failed to load recipes');
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async loadFeaturedRecipes() {
        try {
            const response = await fetch('http://localhost:8000/api/recipes/featured?limit=6');
            const data = await response.json();

            if (response.ok && data.success) {
                this.displayFeaturedRecipes(data.data.recipes);
            }
        } catch (error) {
            console.error('Error loading featured recipes:', error);
        }
    }

    displayRecipes(recipes) {
        const recipesGrid = document.getElementById('recipesGrid');
        if (!recipesGrid) return;

        if (recipes.length === 0) {
            recipesGrid.innerHTML = `
                <div class="no-recipes">
                    <i class="fas fa-search"></i>
                    <h3>No recipes found</h3>
                    <p>Try adjusting your search criteria or filters</p>
                </div>
            `;
            return;
        }

        recipesGrid.innerHTML = recipes.map(recipe => this.createRecipeCard(recipe)).join('');
    }

    displayFeaturedRecipes(recipes) {
        const featuredGrid = document.getElementById('featuredRecipesGrid');
        if (!featuredGrid) return;

        featuredGrid.innerHTML = recipes.map(recipe => this.createRecipeCard(recipe, true)).join('');
    }

    createRecipeCard(recipe, isFeatured = false) {
        const prepTime = recipe.prep_time || 0;
        const cookTime = recipe.cook_time || 0;
        const totalTime = prepTime + cookTime;
        
        const rating = Math.round(recipe.avg_rating * 10) / 10;
        const stars = this.generateStarRating(rating);
        
        const dietaryTags = Array.isArray(recipe.dietary_tags) ? recipe.dietary_tags : [];
        const tagsHtml = dietaryTags.slice(0, 2).map(tag => 
            `<span class="recipe-tag">${tag}</span>`
        ).join('');

        return `
            <div class="recipe-card ${isFeatured ? 'featured' : ''}" data-recipe-id="${recipe.id}">
                <div class="recipe-image">
                    <img src="${recipe.image_url || '/images/default-recipe.jpg'}" 
                         alt="${recipe.title}" 
                         loading="lazy">
                    <div class="recipe-overlay">
                        <button class="recipe-favorite" data-recipe-id="${recipe.id}">
                            <i class="far fa-heart"></i>
                        </button>
                        <div class="recipe-difficulty ${recipe.difficulty_level}">
                            ${recipe.difficulty_level}
                        </div>
                    </div>
                </div>
                <div class="recipe-content">
                    <div class="recipe-header">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <div class="recipe-rating">
                            ${stars}
                            <span class="rating-text">${rating} (${recipe.total_reviews})</span>
                        </div>
                    </div>
                    <p class="recipe-description">${recipe.description || ''}</p>
                    <div class="recipe-meta">
                        <div class="recipe-time">
                            <i class="far fa-clock"></i>
                            <span>${totalTime > 0 ? totalTime + ' min' : 'Quick'}</span>
                        </div>
                        <div class="recipe-servings">
                            <i class="fas fa-users"></i>
                            <span>${recipe.servings} serving${recipe.servings !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="recipe-cuisine">
                            <i class="fas fa-globe"></i>
                            <span>${recipe.cuisine_type || 'International'}</span>
                        </div>
                    </div>
                    <div class="recipe-tags">
                        ${tagsHtml}
                    </div>
                    <div class="recipe-footer">
                        <div class="recipe-author">
                            <i class="fas fa-user-circle"></i>
                            <span>by ${recipe.first_name} ${recipe.last_name}</span>
                        </div>
                        <button class="btn btn-primary recipe-view-btn" data-recipe-id="${recipe.id}">
                            View Recipe
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    displayPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const { current_page, total_pages, total_count } = pagination;
        
        if (total_pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '<div class="pagination-info">';
        paginationHtml += `<span>Showing ${((current_page - 1) * this.recipesPerPage) + 1} - ${Math.min(current_page * this.recipesPerPage, total_count)} of ${total_count} recipes</span>`;
        paginationHtml += '</div><div class="pagination-controls">';

        // Previous button
        paginationHtml += `
            <button class="pagination-btn ${current_page === 1 ? 'disabled' : ''}" 
                    data-page="${current_page - 1}" 
                    ${current_page === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        if (startPage > 1) {
            paginationHtml += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="pagination-btn ${i === current_page ? 'active' : ''}" 
                        data-page="${i}">${i}</button>
            `;
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHtml += `<button class="pagination-btn" data-page="${total_pages}">${total_pages}</button>`;
        }

        // Next button
        paginationHtml += `
            <button class="pagination-btn ${current_page === total_pages ? 'disabled' : ''}" 
                    data-page="${current_page + 1}"
                    ${current_page === total_pages ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHtml += '</div>';
        paginationContainer.innerHTML = paginationHtml;

        // Add click handlers
        paginationContainer.querySelectorAll('.pagination-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadRecipes();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    clearAllFilters() {
        this.currentFilters = {};
        this.currentPage = 1;
        
        // Clear UI
        document.querySelectorAll('.filter-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const searchInput = document.getElementById('recipeSearch');
        if (searchInput) searchInput.value = '';
        
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = 'created_at';
        
        this.loadRecipes();
    }

    showLoading() {
        const recipesGrid = document.getElementById('recipesGrid');
        if (recipesGrid) {
            recipesGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading recipes...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading is hidden when recipes are displayed
    }

    showError(message) {
        const recipesGrid = document.getElementById('recipesGrid');
        if (recipesGrid) {
            recipesGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="recipeManager.loadRecipes()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('recipesGrid') || document.getElementById('featuredRecipesGrid')) {
        window.recipeManager = new RecipeManager();
        
        // Load featured recipes if on homepage
        if (document.getElementById('featuredRecipesGrid')) {
            window.recipeManager.loadFeaturedRecipes();
        }
    }
});