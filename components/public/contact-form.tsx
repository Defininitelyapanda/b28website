"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/contact";

function value(form: FormData, key: string, fallback = "Not provided") {
  const entry = String(form.get(key) || "").trim();
  return entry || fallback;
}

export function ContactForm() {
  const [status, setStatus] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = value(form, "name");
    const email = value(form, "email");
    const projectType = value(form, "projectType", "Project");
    const subject = `New ${projectType} enquiry from ${name}`;
    const body = [
      "Hello B28 Entertainment,",
      "",
      "I would like to discuss a project with you.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${value(form, "phone")}`,
      `Company: ${value(form, "company")}`,
      `Project type: ${projectType}`,
      `Budget range: ${value(form, "budget", "Prefer to discuss")}`,
      `Timeline: ${value(form, "timeline")}`,
      "",
      "Project details:",
      value(form, "message"),
      "",
      "Sent from the B28 Entertainment website.",
    ].join("\n");

    const gmailQuery = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: CONTACT_EMAIL,
      su: subject,
      body,
    });
    const mailtoQuery = new URLSearchParams({ subject, body });
    const composeWindow = window.open(`https://mail.google.com/mail/?${gmailQuery.toString()}`, "_blank", "noopener,noreferrer");

    if (!composeWindow) window.location.href = `mailto:${CONTACT_EMAIL}?${mailtoQuery.toString()}`;
    setStatus(`Your email is ready for ${CONTACT_EMAIL}. Review it in Gmail and press Send.`);
    formElement.reset();
  }

  return <form className="contact-form" onSubmit={submit}>
    <label>Name<input name="name" required/></label>
    <label>Email<input type="email" name="email" required/></label>
    <label>Phone<input name="phone"/></label>
    <label>Company<input name="company"/></label>
    <label>Project type<select name="projectType" required defaultValue=""><option value="" disabled>Select</option><option>Film production</option><option>Documentary</option><option>Music video</option><option>Commercial content</option><option>Post production</option><option>Other</option></select></label>
    <label>Budget range<select name="budget" defaultValue=""><option value="">Prefer to discuss</option><option>Under KES 250,000</option><option>KES 250,000–750,000</option><option>KES 750,000–2,000,000</option><option>KES 2,000,000+</option></select></label>
    <label className="wide">Timeline<input name="timeline" placeholder="When do you hope to begin?"/></label>
    <label className="wide">Tell us about the project<textarea name="message" required minLength={10}/></label>
    <input className="sr-only" name="website" tabIndex={-1} autoComplete="off"/>
    <button className="button light" type="submit">Send project note</button>
    <p className="form-status" role="status">{status}</p>
  </form>;
}
