import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, CreditCard, BookOpen, AlertTriangle, Scale } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      icon: Users,
      title: "User Accounts",
      content: [
        "Users must provide accurate and complete registration information",
        "Account credentials must be kept confidential and secure",
        "Users are responsible for all activities under their account",
        "Accounts are non-transferable between individuals",
        "The school reserves the right to suspend or terminate accounts",
        "Users must notify the school of any unauthorized access"
      ]
    },
    {
      icon: BookOpen,
      title: "Academic Policies",
      content: [
        "Students must adhere to the school's academic integrity policy",
        "Assignment submissions must be original work unless cited",
        "E-learning resources are for personal educational use only",
        "Academic records are official and maintained by the registrar",
        "Grade disputes must be submitted within 14 days of release",
        "Attendance requirements as per Ministry of Education guidelines"
      ]
    },
    {
      icon: CreditCard,
      title: "Fees & Payments",
      content: [
        "All fees are due by the specified payment deadlines",
        "Late payments may incur additional charges as per fee structure",
        "Refund requests are subject to the school's refund policy",
        "Payment methods accepted: EcoCash, OneMoney, Telecash, Bank Cards",
        "Fee statements and invoices are provided through the portal",
        "Outstanding balances may affect access to certain services"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Prohibited Conduct",
      content: [
        "Sharing login credentials with unauthorized persons",
        "Attempting to access other users' accounts or data",
        "Uploading malicious software or harmful content",
        "Using the portal for commercial purposes",
        "Harassing or intimidating other users",
        "Circumventing security measures or access controls"
      ]
    },
    {
      icon: Scale,
      title: "Limitation of Liability",
      content: [
        "The school is not liable for service interruptions beyond our control",
        "Users are responsible for maintaining backup of their data",
        "The portal is provided 'as is' without warranties",
        "Liability is limited to direct damages only",
        "Force majeure events exempt the school from obligations",
        "Users indemnify the school against third-party claims"
      ]
    },
    {
      icon: FileText,
      title: "Changes to Terms",
      content: [
        "The school may update these terms at any time",
        "Users will be notified of significant changes via portal",
        "Continued use constitutes acceptance of updated terms",
        "Previous versions are available upon request",
        "Material changes require 30 days notice",
        "Users may terminate account if they disagree with changes"
      ]
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg">
              Please read these terms carefully before using Wenyasha International School's 
              portal and services.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: February 2024
            </p>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-8">
            <h2 className="font-heading font-semibold text-foreground mb-2">Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using the Wenyasha International School portal, you agree to be bound 
              by these Terms of Service and all applicable laws and regulations. If you do not agree 
              with any of these terms, you are prohibited from using or accessing this portal.
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

          <div className="mt-12 p-6 bg-secondary/50 rounded-xl">
            <h3 className="font-heading font-semibold text-foreground mb-3">Questions?</h3>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@wenyasha.edu.zw" className="text-primary hover:underline">
                legal@wenyasha.edu.zw
              </a>{" "}
              or visit the school administration office.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
