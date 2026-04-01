import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { admissionSchema, type AdmissionFormData, validateFile } from "@/lib/validations";
import { Loader2, Upload, CheckCircle, XCircle, FileText } from "lucide-react";

interface AdmissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

const AdmissionFormModal = ({ open, onOpenChange }: AdmissionFormModalProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      gender: undefined,
      dateOfBirth: "",
      address: "",
      previousSchool: "",
      guardianName: "",
      guardianPhone: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileError(null);
      return;
    }
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: AdmissionFormData) => {
    setStatus("submitting");
    try {
      const message = `*NEW ADMISSION APPLICATION*
      
*Student Details:*
Full Name: ${data.fullName}
Email: ${data.email}
Phone: ${data.phone}
Gender: ${data.gender}
Date of Birth: ${data.dateOfBirth || "Not provided"}
Address: ${data.address || "Not provided"}

*Academic Background:*
Previous School: ${data.previousSchool || "Not provided"}
Result Slip: ${selectedFile ? selectedFile.name : "Not uploaded"}

*Parent/Guardian:*
Name: ${data.guardianName}
Phone: ${data.guardianPhone}

Submitted from: Wenyasha International School Website`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/263784654328?text=${encodedMessage}`;
      window.open(whatsappUrl, "_blank");

      setStatus("success");
      toast({
        title: "Application Submitted",
        description: "You will be redirected to WhatsApp to complete your application.",
      });

      setTimeout(() => {
        form.reset();
        setSelectedFile(null);
        setStatus("idle");
        onOpenChange(false);
      }, 2000);
    } catch {
      setStatus("error");
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (status === "success") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background">
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-primary animate-in zoom-in duration-300" />
            <h3 className="font-heading text-xl font-bold text-foreground">Application Sent!</h3>
            <p className="text-muted-foreground text-sm">
              Your admission application has been forwarded via WhatsApp. Our admissions team will review it shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="font-heading text-2xl text-primary text-center">
            Admission Application
          </DialogTitle>
          <p className="text-center text-muted-foreground text-sm">
            Wenyasha International School Admissions
          </p>
        </DialogHeader>

        {status === "error" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <p>Submission failed. Please check your information and try again.</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4" noValidate>
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-foreground border-b border-border pb-2">
                Student Information
              </h3>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Student Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone No. *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+263..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter home address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Academic Background */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-foreground border-b border-border pb-2">
                Academic Background
              </h3>

              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous School Attended</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter previous school name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Result Slip Upload
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
                    fileError ? "border-destructive bg-destructive/5" : selectedFile ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload result slip"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-foreground text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click or drag to upload (PDF, JPG, PNG — max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                {fileError && (
                  <p className="text-sm font-medium text-destructive" role="alert">{fileError}</p>
                )}
              </div>
            </div>

            {/* Guardian Information */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-foreground border-b border-border pb-2">
                Parent/Guardian Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guardianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent/Guardian Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter guardian name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone No. *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+263..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4 border-t border-border">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedFile(null);
                  setFileError(null);
                }}
                className="border-border text-muted-foreground hover:bg-secondary"
                disabled={status === "submitting"}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdmissionFormModal;
