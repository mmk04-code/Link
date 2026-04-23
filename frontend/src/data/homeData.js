export const homeData = {
  hero: {
    title: "Build products with trusted freelancers, faster.",
    subtitle: "TalentLink brings projects, proposals, contracts, and communication into one focused workflow.",
    primaryAction: {
      label: "Get Started",
      path: "/register",
      variant: "primary",
    },
    secondaryAction: {
      label: "Sign In",
      path: "/login",
      variant: "ghost",
    },
  },
  features: [
    {
      title: "For Clients",
      description: "Post projects, find skilled freelancers, and manage contracts seamlessly",
      action: "Post a Project",
      path: "/register",
      variant: "secondary",
    },
    {
      title: "For Freelancers",
      description: "Discover work opportunities, submit proposals, and grow your career",
      action: "Find Work",
      path: "/register",
      variant: "secondary",
    },
  ],
  steps: [
    { id: 1, title: "Post a Project" },
    { id: 2, title: "Receive Proposals" },
    { id: 3, title: "Select & Contract" },
    { id: 4, title: "Complete & Review" },
  ],
  stepsTitle: "How it works",
  cta: {
    title: "Ready to build your next project?",
    description: "Create your account in minutes and start collaborating immediately.",
    action: "Create Free Account",
    path: "/register",
    variant: "primary",
  },
};
