const btnColorSwitch = document.querySelector('#switch');

btnColorSwitch.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    btnColorSwitch.classList.toggle('active');
});