export interface Testimonial {
    quote: string;
    company: string;
    image: string;
  }
  
  export const testimonials: Testimonial[] = [
    {
      quote:
        "You know a tool is working when people come up and ask 'How can I get better?' Scenes has upped my client engagement level 500%.",
      company: "Globetrek Voyages",
      image: "/img/profile1.svg",
    },
    {
      quote:
        "This platform has transformed how we manage travel itineraries. Our clients love the seamless experience and we've seen bookings increase by 40%.",
      company: "Adventure Horizons",
      image: "/img/profile2.svg",
    },
    {
      quote:
        "The customization options are incredible. We can tailor every aspect of the journey to match our clients' preferences, making each trip truly unique.",
      company: "Wanderlust Expeditions",
      image: "/img/profile3.svg",
    },
  ];
  