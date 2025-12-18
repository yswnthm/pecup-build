"use client";

import { useEffect, useState } from "react";

export default function Hero() {
  const [texts, setTexts] = useState<string[]>([
    "PEC.UP Welcomes You!!",
    "looking for resources?",
    "happy learning!",
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (texts.length === 0 || isLoading) return;

    let count = 0;
    let index = 0;
    let currentText = "";
    let letter = "";
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      if (count === texts.length) {
        count = 0;
      }
      currentText = texts[count];
      letter = currentText.slice(0, ++index);

      const heading = document.getElementById("typing-heading");
      if (heading) {
        heading.textContent = letter;
      }
      if (letter.length === currentText.length) {
        count++;
        index = 0;
        timeoutId = setTimeout(type, 2000); // Pause before typing the next word
      } else {
        timeoutId = setTimeout(type, 150);
      }
    };

    type();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [texts, isLoading]);

  return (
    <section id="hero">
      <div className="hero-content text-container">
        <div className="animated-text">
          <h1 id="typing-heading"></h1>
        </div>
        <a href="/resources" className="btn-project">
          resources?
        </a>
        <p className="centered-text">
          pickup by <span className="pickup">PEC.UP</span>
        </p>
      </div>
    </section>
  );
}
