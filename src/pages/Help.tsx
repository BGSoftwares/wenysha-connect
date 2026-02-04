import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageSquare, 
  BookOpen, 
  Key, 
  CreditCard,
  Calendar,
  FileText,
  Users,
  ChevronRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Help = () => {
  const faqs = [
    {
      category: "Account & Login",
      icon: Key,
      questions: [
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot Password' on the login page and enter your registered email. You'll receive a reset link within 5 minutes. If you don't receive it, check your spam folder or contact IT support."
        },
        {
          q: "Why can't I log into my account?",
          a: "Common reasons include: incorrect credentials, account not yet activated (check with admin), or temporary lockout after multiple failed attempts. Wait 30 minutes or contact support."
        },
        {
          q: "How do I update my profile information?",
          a: "Navigate to Settings > Profile in your dashboard. You can update your phone number, address, and emergency contacts. Some fields require admin approval to change."
        }
      ]
    },
    {
      category: "Fees & Payments",
      icon: CreditCard,
      questions: [
        {
          q: "What payment methods are accepted?",
          a: "We accept EcoCash, OneMoney, Telecash, and bank cards (Visa/Mastercard) through our secure Paynow integration. Cash payments can be made at the accounts office."
        },
        {
          q: "How do I download my fee statement?",
          a: "Go to the Fees section in your student dashboard and click 'Download Statement'. You can generate statements for specific terms or the entire academic year."
        },
        {
          q: "What happens if I miss a payment deadline?",
          a: "Late payments may incur a penalty as per the fee structure. Contact the accounts office to arrange a payment plan if you're experiencing difficulties."
        }
      ]
    },
    {
      category: "Academic Records",
      icon: FileText,
      questions: [
        {
          q: "How do I view my report card?",
          a: "Navigate to Report Card in your student dashboard. You can view and download report cards for completed terms. Results are usually available within 2 weeks after exams."
        },
        {
          q: "How do I request a transcript?",
          a: "Submit a transcript request through the portal or visit the registrar's office. Processing takes 3-5 business days. There may be a fee for additional copies."
        },
        {
          q: "Why are my grades not showing?",
          a: "Grades appear after teachers submit and administrators verify them. Contact your class teacher if results are delayed beyond the expected release date."
        }
      ]
    },
    {
      category: "E-Learning",
      icon: BookOpen,
      questions: [
        {
          q: "How do I access learning materials?",
          a: "Go to E-Learning in your dashboard to access study notes, past papers, and video lessons organized by subject. Materials are uploaded by your teachers."
        },
        {
          q: "Can I download resources for offline use?",
          a: "Yes, most PDF documents and study guides can be downloaded. Video content requires an internet connection to stream."
        },
        {
          q: "How do I submit assignments online?",
          a: "Click on Assignments, select the relevant task, and upload your file (PDF, Word, or image). Ensure you submit before the deadline shown."
        }
      ]
    },
    {
      category: "Timetable & Attendance",
      icon: Calendar,
      questions: [
        {
          q: "Where can I find my class timetable?",
          a: "Your personalized timetable is available in the Timetable section of your dashboard. It shows all your classes, times, and room locations."
        },
        {
          q: "How is attendance tracked?",
          a: "Teachers mark attendance at the start of each class. You can view your attendance record in the dashboard. Parents receive notifications for unexplained absences."
        },
        {
          q: "How do I report an absence in advance?",
          a: "Parents can notify the school through the portal's messaging system or by calling the school office. Provide the reason and expected duration of absence."
        }
      ]
    },
    {
      category: "Parents & Communication",
      icon: Users,
      questions: [
        {
          q: "How do I contact my child's teacher?",
          a: "Use the Messages section in your parent portal to send direct messages to teachers. You can also schedule meetings through the appointments system."
        },
        {
          q: "How do I receive school announcements?",
          a: "Announcements appear on your dashboard and are sent via email/SMS. Ensure your contact details are up to date to receive notifications."
        },
        {
          q: "Can I view my child's progress in real-time?",
          a: "Yes, the parent portal shows grades, attendance, and teacher comments as they're updated. Enable notifications for real-time alerts."
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
              Help Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Find answers to common questions or reach out to our support team.
            </p>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Card className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <Mail className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Email Support</h3>
                <a href="mailto:support@wenyasha.edu.zw" className="text-sm text-muted-foreground hover:text-primary">
                  support@wenyasha.edu.zw
                </a>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <Phone className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Phone Support</h3>
                <p className="text-sm text-muted-foreground">+263 39 123 456</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <MessageSquare className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Office Hours</h3>
                <p className="text-sm text-muted-foreground">Mon-Fri, 8am-4pm</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqs.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <section.icon className="h-6 w-6 text-primary" />
                    {section.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.questions.map((faq, idx) => (
                      <AccordionItem key={idx} value={`${index}-${idx}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Still Need Help */}
          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="font-heading text-xl font-semibold mb-2">Still Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button variant="gold" asChild>
                  <a href="mailto:support@wenyasha.edu.zw">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="tel:+26339123456">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Us
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Help;
