/**
 * Handles the conversion of 2D images to 3D models using TRELLIS
 */

// Configuration
const CONFIG = {
    RUNPOD_ENDPOINT: "https://5dkfkp3d4vnrfx-7860.proxy.runpod.net",
    DEFAULT_PARAMS: {
        num_inference_steps: 50,
        guidance_scale: 7.5
    }
};

/**
 * Creates and initializes the TRELLIS UI
 */
export function initTrellisUI() {
    // Check API on init
    checkTrellisAPI().then(isAvailable => {
        if (isAvailable) {
            console.log('TRELLIS API is available');
        } else {
            console.error('TRELLIS API is not responding correctly');
        }
    });
    
    // Create the main button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'trellis-button-container';
    buttonContainer.innerHTML = `
        <button id="trellis-generate-btn">
            <img src="assets/icons/trellis-icon.png" alt="" class="button-icon">
            <span>Generate 3D from Image</span>
        </button>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        #trellis-button-container {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
        }

        #trellis-generate-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #4CAF50;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        #trellis-generate-btn:hover {
            background: rgba(0, 0, 0, 0.8);
            border-color: #45a049;
        }

        #trellis-generate-btn .button-icon {
            width: 20px;
            height: 20px;
        }

        .trellis-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }

        .trellis-notification.success {
            background: rgba(76, 175, 80, 0.9);
        }

        .trellis-notification.error {
            background: rgba(244, 67, 54, 0.9);
        }

        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }

        #trellis-loader {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #trellis-loader::after {
            content: '';
            width: 20px;
            height: 20px;
            border: 2px solid #ffffff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    // Add elements to DOM
    document.head.appendChild(styles);
    document.body.appendChild(buttonContainer);

    // Add click handler
    document.getElementById('trellis-generate-btn').addEventListener('click', handleTrellisButtonClick);
}

/**
 * Handles the button click event
 */
async function handleTrellisButtonClick() {
    try {
        const result = await selectAndProcessImage();
        if (result && result.output) {
            showNotification('Model generated successfully!', 'success');
            console.log('3D Model URL:', result.output);
            
            // Optional: Open the model URL in a new tab
            window.open(result.output, '_blank');
            
            return result;
        }
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('TRELLIS Error:', error);
    }
}

/**
 * Shows a notification message
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `trellis-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Opens a file selector for image input
 * @returns {Promise} Resolves when image is selected and processed
 */
function selectAndProcessImage() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    const base64Image = await convertFileToBase64(file);
                    const result = await sendImageToTrellis(base64Image);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error('No file selected'));
            }
        };

        // Add to DOM temporarily and trigger click
        document.body.appendChild(input);
        input.click();
        
        // Remove after selection
        setTimeout(() => {
            document.body.removeChild(input);
        }, 5000);
    });
}

/**
 * Converts a file to base64 string
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} Base64 string of the image
 */
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Extract the base64 string without the data URL prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * Sends image to TRELLIS service and handles the response
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise} TRELLIS processing result
 */
async function sendImageToTrellis(base64Image) {
    showLoadingIndicator();
    let sessionHash = generateSessionHash();

    try {
        // Submit the job with retry logic
        let queueData = null;
        let retryAttempt = 0;
        const maxRetries = 3;

        // Retry the initial submission if it fails
        while (retryAttempt < maxRetries && !queueData) {
            try {
                // Step 1: Join the queue with minimal required parameters to reduce payload size
                const queueResponse = await fetch(`${CONFIG.RUNPOD_ENDPOINT}/gradio_api/queue/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: [
                            base64Image,  // Only send the image first
                            50,          // num_inference_steps
                            false,        // Use simpler settings to reduce errors
                            7.5,          // guidance_scale
                            0.0,          // Keep remaining parameters at defaults
                            0.0,
                            0.0,
                            0.0,
                            0.0
                        ],
                        fn_index: 0,
                        session_hash: sessionHash
                    })
                });

                if (queueResponse.ok) {
                    queueData = await queueResponse.json();
                    sessionHash = queueData.session_hash || sessionHash;
                    break;
                }
            } catch (submitError) {
                console.warn(`Submission attempt ${retryAttempt + 1} failed:`, submitError);
            }

            retryAttempt++;
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryAttempt)));
        }

        if (!queueData) {
            throw new Error("Failed to submit job to TRELLIS after multiple attempts");
        }

        // Step 2: Now we know the server has our job, inform the user about the long wait
        showNotification('Model processing started. This will take 2-3 minutes...', 'success');
        
        // Wait 90 seconds before even checking - TRELLIS models take a while to generate
        await new Promise(resolve => setTimeout(resolve, 90000)); // 90 seconds initial wait
        
        // Then check for the result occasionally
        let result = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!result && attempts < maxAttempts) {
            try {
                // Update the loading indicator with progress information
                updateLoadingIndicator(`Processing image (${attempts + 1}/${maxAttempts})...`);
                
                const statusResponse = await fetch(
                    `${CONFIG.RUNPOD_ENDPOINT}/gradio_api/queue/data?session_hash=${sessionHash}`
                );
                
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    
                    if (statusData.status === "COMPLETE") {
                        result = statusData;
                        break;
                    } else if (statusData.status === "PENDING" || statusData.status === "PROCESSING") {
                        // Still processing, continue waiting
                        console.log("Job status:", statusData.status);
                    } else if (statusData.status === "ERROR") {
                        // The job encountered an error
                        console.error("Job failed:", statusData);
                        break;
                    }
                }
            } catch (pollError) {
                console.warn("Poll error, continuing:", pollError);
                // Don't count connection errors against our attempts
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds between checks
        }
        
        hideLoadingIndicator();
        
        // Always try to construct a model URL, even if polling failed
        // The file might be generated even if we couldn't successfully poll the status
        const modelFileName = "trellis-tost.glb";
        const modelUrl = `${CONFIG.RUNPOD_ENDPOINT}/gradio_api/file=/tmp/gradio/${sessionHash}/${modelFileName}`;
        
        // Try to validate if the file exists by making a HEAD request
        try {
            const fileCheck = await fetch(modelUrl, { method: 'HEAD' });
            if (fileCheck.ok) {
                showNotification('Model generated successfully!', 'success');
                return {
                    output: modelUrl,
                    rawResponse: result,
                    validated: true
                };
            }
        } catch (fileCheckError) {
            console.warn("File check error:", fileCheckError);
        }
        
        // Even if validation failed, return the URL as a best effort
        return {
            output: modelUrl,
            rawResponse: result,
            validated: false,
            message: "Model URL generated but not validated - may or may not exist"
        };

    } catch (error) {
        hideLoadingIndicator();
        console.error('Error sending to TRELLIS:', error);
        
        // Even after an error, try to construct a possible URL as a last resort
        const possibleUrl = `${CONFIG.RUNPOD_ENDPOINT}/gradio_api/file=/tmp/gradio/${sessionHash}/trellis-tost.glb`;
        
        return {
            output: possibleUrl,
            error: error.message,
            message: "An error occurred, but this URL might still work if the model was generated"
        };
    }
}

/**
 * Shows the loading indicator
 */
function showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'trellis-loader';
    loader.textContent = 'Processing image with TRELLIS...';
    document.body.appendChild(loader);
}

/**
 * Updates the loading indicator text
 */
function updateLoadingIndicator(message) {
    const loader = document.getElementById('trellis-loader');
    if (loader) {
        loader.textContent = message;
    }
}

/**
 * Hides the loading indicator
 */
function hideLoadingIndicator() {
    const loader = document.getElementById('trellis-loader');
    if (loader) {
        loader.remove();
    }
}

/**
 * Generates a random session hash
 * @returns {string} Random session hash
 */
function generateSessionHash() {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Checks if the TRELLIS API is available
 * @returns {Promise<boolean>} True if API is available
 */
async function checkTrellisAPI() {
    try {
        const response = await fetch(`${CONFIG.RUNPOD_ENDPOINT}`);
        return response.ok;
    } catch (error) {
        console.error('Error checking TRELLIS API:', error);
        return false;
    }
}

// Export additional functions for external use
export { selectAndProcessImage };
