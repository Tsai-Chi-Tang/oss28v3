document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".section");

  sections.forEach(section => {
    const inputs = section.querySelectorAll(".input");
    const totalDisplay = section.querySelector(".total");

    inputs.forEach(input => {
      input.addEventListener("input", () => {
        let total = 0;
        inputs.forEach(i => {
          total += parseFloat(i.value) || 0;
        });
        totalDisplay.textContent = total.toFixed(2);
      });
    });
  });
});

function flipCard(card) {
  card.classList.toggle('flipped');
}

