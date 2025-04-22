document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('user-input');
    const submitBtn = document.getElementById('submit-btn');
    const thoughtStream = document.getElementById('thought-stream');
    const imageThoughts = document.getElementById('image-thoughts');
    const aiResponse = document.getElementById('ai-response');
    const thinkingIndicator = document.querySelector('.thinking-indicator');
    
    let conversationHistory = [];
    
    submitBtn.addEventListener('click', async function() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Clear previous thoughts and response
        thoughtStream.innerHTML = '';
        imageThoughts.innerHTML = '';
        aiResponse.innerHTML = '';
        
        // Show thinking indicator
        thinkingIndicator.classList.add('active');
        
        try {
            await processInput(message);
            
            // After all processing, generate the final response
            const finalResponse = await generateResponse(message, conversationHistory);
            aiResponse.textContent = finalResponse;
            
            // Add to conversation history
            conversationHistory.push({
                role: "user",
                content: message
            });
            conversationHistory.push({
                role: "assistant",
                content: finalResponse
            });
            
            // Keep history from growing too large
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
            
        } catch (error) {
            console.error('Error processing input:', error);
            aiResponse.textContent = "I encountered an error while processing your message. Please try again.";
        } finally {
            // Hide thinking indicator
            thinkingIndicator.classList.remove('active');
        }
    });
    
    async function processInput(input) {
        // Split input into sentences
        const sentences = input.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [input];
        
        // Process each sentence
        for (const sentence of sentences) {
            await processSentence(sentence.trim());
        }
        
        // Add a final thought about the whole message
        await addThought("Now that I've processed each part of the message, let me formulate a comprehensive response.");
    }
    
    async function processSentence(sentence) {
        await addThought(`Processing: "${sentence}"`);
        
        // Split sentence into chunks (3-5 words per chunk)
        const words = sentence.split(/\s+/);
        const chunks = [];
        for (let i = 0; i < words.length; i += 4) {
            chunks.push(words.slice(i, i + 4).join(' '));
        }
        
        // Process each chunk with internal thoughts
        for (const chunk of chunks) {
            await addThought(`Analyzing chunk: "${chunk}"`, true);
            
            // Simulate internal processing with a thought
            const internalThought = await simulateInternalThought(chunk);
            await addThought(internalThought, true);
            
            // Occasionally generate an image based on certain triggers
            if (shouldGenerateImage(chunk, internalThought)) {
                await generateAndProcessImage(chunk);
            }
        }
    }
    
    async function simulateInternalThought(chunk) {
        // Here we would normally call an LLM, but we'll simulate it for now
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant analyzing text input word by word. Generate a brief internal thought (1-2 sentences) about this text chunk."
                    },
                    {
                        role: "user",
                        content: chunk
                    }
                ]
            });
            return completion.content;
        } catch (error) {
            console.error("Error generating internal thought:", error);
            return `Pondering the meaning and context of "${chunk}"...`;
        }
    }
    
    function shouldGenerateImage(chunk, thought) {
        // Look for visual cues in the text
        const visualTriggers = [
            'picture', 'image', 'see', 'look', 'visual', 'scene', 
            'landscape', 'portrait', 'view', 'beautiful', 'artistic'
        ];
        
        const combined = chunk + ' ' + thought;
        
        return visualTriggers.some(trigger => 
            combined.toLowerCase().includes(trigger.toLowerCase())
        ) && Math.random() < 0.5; // Only 50% chance to avoid too many images
    }
    
    async function generateAndProcessImage(prompt) {
        await addThought(`I should visualize "${prompt}" to better understand it.`, true);
        
        try {
            const result = await websim.imageGen({
                prompt: prompt,
                aspect_ratio: "1:1"
            });
            
            // Add the image to the thought process
            const imageElement = document.createElement('img');
            imageElement.src = result.url;
            imageElement.alt = `Visualization of "${prompt}"`;
            imageElement.className = 'generated-image';
            imageThoughts.appendChild(imageElement);
            
            // Process the image with another thought
            await addThought(`Looking at this visualization helps me understand "${prompt}" better.`, true);
            
            // Analyze the generated image
            const imageAnalysis = await analyzeGeneratedImage(result.url, prompt);
            await addThought(imageAnalysis, true);
            
        } catch (error) {
            console.error("Error generating or analyzing image:", error);
            await addThought("I attempted to generate an image but encountered an issue.", true);
        }
    }
    
    async function analyzeGeneratedImage(imageUrl, prompt) {
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an AI analyzing a generated image. Provide a brief description (2-3 sentences) of what you see and how it relates to the prompt."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this image generated for the prompt: "${prompt}"`
                            },
                            {
                                type: "image_url",
                                image_url: { url: imageUrl }
                            }
                        ]
                    }
                ]
            });
            
            return completion.content;
        } catch (error) {
            console.error("Error analyzing image:", error);
            return `Visual examination of the image generated from "${prompt}"...`;
        }
    }
    
    async function generateResponse(originalInput, conversationHistory) {
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a thoughtful AI assistant who has carefully analyzed the user's input. Provide a helpful, empathetic response based on your analysis."
                    },
                    ...conversationHistory,
                    {
                        role: "user",
                        content: originalInput
                    }
                ]
            });
            
            return completion.content;
        } catch (error) {
            console.error("Error generating final response:", error);
            return "After carefully considering your message, I'd like to respond... [Error generating complete response]";
        }
    }
    
    async function addThought(thought, isInternal = false) {
        // Add the thought to the stream
        const thoughtElement = document.createElement('div');
        thoughtElement.className = `thought ${isInternal ? 'internal' : ''}`;
        thoughtElement.textContent = thought;
        thoughtStream.appendChild(thoughtElement);
        
        // Scroll to the bottom of the thought stream
        thoughtStream.scrollTop = thoughtStream.scrollHeight;
        
        // Add a small delay to simulate thinking
        return new Promise(resolve => {
            setTimeout(resolve, isInternal ? 800 : 1200);
        });
    }
});

