const  name = document.getElementById('name')
const email = document.getElementById('email')
const subject = document.getElementById('subject')
const message = document.getElementById('message')
const contactform = document.getElementById('contactform')
const errorElement = document.getElementById('error')

contactform.addEventListener('submit', (e) => {
    let messages = []
    if(name.value === "" || name.value === null){
        messages.push('Name is required.')
    }
    if(email.value === "" || email.value === null){
        messages.push('Email is required')
    }
    if(subject.value === "" || subject.value === null){
        messages.push('Subject is required.')
    }
    if(message.value ==="" || message.value === null){
        messages.push('Message is required')
    }
    if(messages.length > 0){
        e.preventDefault()
        errorElement.innerText = messages.join(', ')
    }
    
})
