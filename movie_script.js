const API_KEY = "50d00169b40a3b13b0144f1dde8aad81";
let currentPage = 1;
let currentQuery = "";
let currentGenre = "";

// SHOW LOADING
function showLoading(show) {
    $("#loading").toggle(show);
}

// ERROR HANDLING
function showError(msg) {
    $("#error").text(msg);
}

// SEARCH
$("#searchBtn").click(function () {
    currentQuery = $("#searchBox").val();
    currentPage = 1;
    fetchMovies();
});

// GENRE FILTER
$("#genreSelect").change(function () {
    currentGenre = $(this).val();
    currentPage = 1;
    fetchMovies();
});

// FETCH MOVIES
function fetchMovies() {
    showLoading(true);
    showError("");

    let url = "";

    if (currentQuery) {
        url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${currentQuery}&page=${currentPage}`;
    } else if (currentGenre) {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${currentGenre}&page=${currentPage}`;
    } else {
        loadPopular();
        return;
    }

    $.getJSON(url)
        .done(data => {
            displayMovies(data.results);
            setupPagination(5);
        })
        .fail(() => showError("Failed to load data"))
        .always(() => showLoading(false));
}

// DISPLAY MOVIES
function displayMovies(movies) {
    $("#results").empty();

    movies.slice(0, 10).forEach(movie => {
        $("#results").append(`
            <div class="movie">
                <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" onclick="getDetails(${movie.id})">
                <p>${movie.title}</p>
                <button onclick="addFavorite(${movie.id}, '${movie.title}', '${movie.poster_path}')">❤️</button>
            </div>
        `);
    });
}

// PAGINATION
function setupPagination(total) {
    $("#pagination").empty();

    for (let i = 1; i <= total; i++) {
        $("#pagination").append(`<button onclick="goPage(${i})">${i}</button>`);
    }
}

function goPage(page) {
    currentPage = page;
    fetchMovies();
}

// DETAILS
function getDetails(id) {
    showLoading(true);

    // FIRST CALL: Movie details
    $.getJSON(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`, function (movie) {

        // SECOND CALL: Credits (for director)
        $.getJSON(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`, function (credits) {

            let director = "Not Available";

            // Find director from crew
            let directorObj = credits.crew.find(person => person.job === "Director");
            if (directorObj) {
                director = directorObj.name;
            }

            // DISPLAY for details
            $("#details").html(`
                <div style="display:flex; gap:20px; flex-wrap:wrap;">
                    
                    <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" 
                         style="border-radius:10px;">

                    <div>
                        <h2>${movie.title}</h2>
                        <p><strong>Director:</strong> ${director}</p>
                        <p><strong>Release:</strong> ${movie.release_date}</p>
                        <p><strong>Rating:</strong> ${movie.vote_average}</p>
                        <p>${movie.overview}</p>
                    </div>

                </div>
            `);

        });

    }).fail(() => {
        showError("Failed to load movie details");
    }).always(() => {
        showLoading(false);
    });
}

// FAVORITES (localStorage)
function addFavorite(id, title, poster) {
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];

    if (!favs.find(m => m.id === id)) {
        favs.push({ id, title, poster });
        localStorage.setItem("favorites", JSON.stringify(favs));
        loadFavorites();
    }
}

function loadFavorites() {
    $("#favorites").empty();

    let favs = JSON.parse(localStorage.getItem("favorites")) || [];

    favs.forEach(movie => {
        $("#favorites").append(`
            <div class="movie">
                <img src="https://image.tmdb.org/t/p/w200${movie.poster}" onclick="getDetails(${movie.id})">
                <p>${movie.title}</p>
            </div>
        `);
    });
}

// LOAD POPULAR
function loadPopular() {
    showLoading(true);

    $.getJSON(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`)
        .done(data => {
            $("#popular").empty();
            data.results.slice(0, 10).forEach(movie => {
                $("#popular").append(`
                    <div class="movie">
                        <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" onclick="getDetails(${movie.id})">
                        <p>${movie.title}</p>
                    </div>
                `);
            });
        })
        .always(() => showLoading(false));
}

// LOAD GENRES
function loadGenres() {
    $.getJSON(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`)
        .done(data => {
            data.genres.forEach(g => {
                $("#genreSelect").append(`<option value="${g.id}">${g.name}</option>`);
            });
        });
}

// INIT
loadGenres();
loadPopular();
loadFavorites();
