import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const ADMIN_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ADMIN_INVITE;
const PROFESSOR_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_PROFESSOR_INVITE || 'template_vdtpkgj';
const STUDENT_TEMPLATE_ID = PROFESSOR_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendAdminInvite = async (to_email, invite_link) => {
  if (!SERVICE_ID || !ADMIN_TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('EmailJS environment variables are not set.');
    throw new Error('EmailJS is not configured.');
  }

  const templateParams = {
    to_email,
    invite_link,
    user_type: 'admin',
  };

  try {
    return await emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, templateParams, PUBLIC_KEY);
  } catch (error) {
    console.error('EmailJS failed:', error);
    throw error;
  }
};

export const sendProfessorInvite = async (to_email, invite_link) => {
  if (!SERVICE_ID || !PROFESSOR_TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('EmailJS environment variables are not set.');
    throw new Error('EmailJS is not configured.');
  }

  const templateParams = {
    to_email,
    invite_link,
    user_type: 'professor',
  };

  try {
    return await emailjs.send(SERVICE_ID, PROFESSOR_TEMPLATE_ID, templateParams, PUBLIC_KEY);
  } catch (error) {
    console.error('EmailJS failed:', error);
    throw error;
  }
};

export const sendStudentInvite = async (to_email, invite_link) => {
  if (!SERVICE_ID || !STUDENT_TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('EmailJS environment variables are not set.');
    throw new Error('EmailJS is not configured.');
  }

  const templateParams = {
    to_email,
    invite_link,
    user_type: 'student',
  };

  try {
    return await emailjs.send(SERVICE_ID, STUDENT_TEMPLATE_ID, templateParams, PUBLIC_KEY);
  } catch (error) {
    console.error('EmailJS failed:', error);
    throw error;
  }
};
