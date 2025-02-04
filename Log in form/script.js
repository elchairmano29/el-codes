document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Basic validation
    if (username === '' || password === '') {
        alert('Please fill in all fields.');
    } else {
        // Simulate a login request (replace with actual API call)
        alert('Login successful!');
        // Redirect to another page or perform other actions
    }
});