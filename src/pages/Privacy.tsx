import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Student enrollment and academic records",
        "Parent/guardian contact information",
        "Payment and financial transaction data",
        "Login credentials and authentication data",
        "Academic performance and attendance records",
        "Communication logs within the portal"
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "Managing student enrollment and academic progress",
        "Facilitating communication between school and parents",
        "Processing fee payments and generating financial statements",
        "Providing access to educational resources and e-learning",
        "Sending important announcements and notifications",
        "Improving our services and user experience"
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        "End-to-end encryption for all sensitive data",
        "Secure authentication with password hashing",
        "Role-based access control for different user types",
        "Regular security audits and vulnerability assessments",
        "Secure data backups and disaster recovery procedures",
        "Compliance with data protection regulations"
      ]
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content: [
        "Access your personal data held by the school",
        "Request correction of inaccurate information",
        "Request deletion of your data (where applicable)",
        "Opt out of non-essential communications",
        "Data portability upon request",
        "Lodge complaints with relevant authorities"
      ]
    },
    {
      icon: Shield,
      title: "Data Sharing",
      content: [
        "We do not sell personal data to third parties",
        "Data is shared only with authorized school staff",
        "External service providers are bound by confidentiality",
        "Government bodies may access data as required by law",
        "Academic transcripts shared with authorized institutions",
        "Payment processors handle financial data securely"
      ]
    },
    {
      icon: Mail,
      title: "Contact Us",
      content: [
        "For privacy concerns, contact our Data Protection Officer",
        "Email: privacy@wenyasha.edu.zw",
        "Phone: +263 39 123 456",
        "Address: Wenyasha International School, Masvingo",
        "Response time: Within 48 business hours",
        "Written requests processed within 30 days"
      ]
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Your privacy is important to us. This policy explains how Wenyasha International School 
              collects, uses, and protects your personal information.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: February 2024
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <section.icon className="h-6 w-6 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.content.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 bg-secondary/50 rounded-xl text-center">
            <p className="text-muted-foreground">
              By using Wenyasha International School's portal and services, you agree to the 
              collection and use of information in accordance with this policy.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
