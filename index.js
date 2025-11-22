const loginPage = document.getElementById('login-page-content');
const signupPage = document.getElementById('signup-page-content');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function goToSignupPage() {
    loginPage.style.display = 'none';
    signupPage.style.display = 'flex';
}

function goToLoginPage() {
    signupPage.style.display = 'none';
    loginPage.style.display = 'flex';
}

const yearSelect = document.getElementById('yearSelect');
if (yearSelect) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 100; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
}

const selectDay = document.getElementById('selectDay');
if (selectDay) {
    const currentDay = new Date().getDate();
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        selectDay.appendChild(option);
    }
}

// User class with profile picture and saved posts
class User {
    constructor(id, firstName, sureName, email, password) {
        this.id = id;
        this.firstName = firstName;
        this.sureName = sureName;
        this.fullName = firstName + " " + sureName;
        this.email = email;
        this.password = password;
        this.profilePicture = "profile.jpg"; // Default profile picture
        this.posts = []
        this.friends = []
        this.friendRequest = []
        this.savedPosts = []; // For bookmarks
        this.notifications = []; // For notifications
    }
}

function signupDetails(event) {
    event.preventDefault();
    var firstName = document.getElementById("firstName").value;
    var sureName = document.getElementById("sureName").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var message = document.getElementById("message");

    if (firstName === "" || sureName === "" || email === "" || password === "") {
        message.innerText = "Please fill all fields before signing up!";
        message.style.color = "red";
        return;
    }

    var users = JSON.parse(localStorage.getItem("facebookUser")) || [];

    let result = users.find((element) => element.email == email)
    if (result?.email) {
        alert("user already exist")
    } else {
        let newId = users.length
        let user = new User(newId, firstName, sureName, email, password)
        users.push(user)
        localStorage.setItem("facebookUser", JSON.stringify(users))
    }

    document.getElementById("signup-page-content").style.display = 'none';
    document.getElementById("login-page-content").style.display = 'flex';
}

function login(event) {
    event.preventDefault();
    var loginEmail = document.getElementById("loginEmail").value;
    var loginPassword = document.getElementById("loginPassword").value;
    var loginMessage = document.getElementById("loginMessage");

    var users = JSON.parse(localStorage.getItem("facebookUser")) || [];
    let loggedInUser = users.find((element) => element.email === loginEmail && element.password === loginPassword);

    if (loggedInUser) {
        localStorage.setItem("isLoggedIn", "true")
        let users = JSON.parse(localStorage.getItem("facebookUser")) || [];
        users.newId = loggedInUser.id;
        localStorage.setItem("facebookUser", JSON.stringify(users));

        localStorage.setItem("currentUser", JSON.stringify(loggedInUser));

        window.location.href = "dashbord.html"
    } else {
        loginMessage.innerHTML = "Invalid email or password! Please try again.";
        loginMessage.style.color = "red";
    }
}

function checkUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (currentUser) {
        window.location.href = "dashbord.html"
        return;
    }
};
checkUser();