document.addEventListener('DOMContentLoaded', function() {
    console.log('website loaded successfully!');
});

document.getElementById('hamburger').addEventListener('click',function(){
    const navMenu = document.getElementById('nav-menu');
});

document.getElementById('dark-mode-toggle').addEventListener('click',function(){
    document.body.classList.toggle('dark-mode');
});

document.querySelector('form').addEventListener('submit',function(e){
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    if (!name || !email || !message) {
        e.preventDefault();
        alert('Please fill out all fields');
    }
})