// Firebase Authentication Functions

// Register new user
async function registerUser(email, password, name) {
    try {
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update display name
        await user.updateProfile({
            displayName: name
        });
        
        // Send email verification
        await user.sendEmailVerification();
        
        console.log('User registered:', user.uid);
        return { success: true, user: user };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('User logged in:', user.uid);
        return { success: true, user: user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Logout user
async function logoutUser() {
    try {
        await firebaseAuth.signOut();
        console.log('User logged out');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Get current user
function getCurrentUser() {
    return firebaseAuth.currentUser;
}

// Check auth state
function onAuthStateChanged(callback) {
    firebaseAuth.onAuthStateChanged(callback);
}

// Password reset
async function resetPassword(email) {
    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

// Get ID token (for backend verification if needed)
async function getIdToken() {
    const user = getCurrentUser();
    if (user) {
        return await user.getIdToken();
    }
    return null;
}

// Export functions
window.firebaseAuthFunctions = {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    onAuthStateChanged,
    resetPassword,
    getIdToken
};
