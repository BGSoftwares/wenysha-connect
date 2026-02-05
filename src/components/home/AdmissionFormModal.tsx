import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AdmissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdmissionFormModal = ({ open, onOpenChange }: AdmissionFormModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    previousSchool: "",
    resultSlip: "",
    guardianName: "",
    guardianPhone: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      previousSchool: "",
      resultSlip: "",
      guardianName: "",
      guardianPhone: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.phone || !formData.gender) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create WhatsApp message
    const message = `*NEW ADMISSION APPLICATION*
    
*Student Details:*
Full Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Gender: ${formData.gender}
Date of Birth: ${formData.dateOfBirth}
Address: ${formData.address}

*Academic Background:*
Previous School: ${formData.previousSchool}
Result Slip: ${formData.resultSlip}

*Parent/Guardian:*
Name: ${formData.guardianName}
Phone: ${formData.guardianPhone}

Submitted from: Wenyasha International School Website`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/263784654328?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Application Submitted",
      description: "You will be redirected to WhatsApp to complete your application.",
    });

    handleReset();
    onOpenChange(false);
  };

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

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-foreground border-b border-border pb-2">
              Student Information
            </h3>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="fullName" className="text-foreground">Full Student Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Enter full name"
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-foreground">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@example.com"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-foreground">Phone No. *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+263..."
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender" className="text-foreground">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-foreground">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-foreground">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter home address"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Academic Background */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-foreground border-b border-border pb-2">
              Academic Background
            </h3>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="previousSchool" className="text-foreground">Previous School Attended</Label>
                <Input
                  id="previousSchool"
                  value={formData.previousSchool}
                  onChange={(e) => handleChange("previousSchool", e.target.value)}
                  placeholder="Enter previous school name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="resultSlip" className="text-foreground">Result Slip (Reference)</Label>
                <Input
                  id="resultSlip"
                  value={formData.resultSlip}
                  onChange={(e) => handleChange("resultSlip", e.target.value)}
                  placeholder="Enter result slip reference or grades"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-foreground border-b border-border pb-2">
              Parent/Guardian Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianName" className="text-foreground">Parent/Guardian Name</Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => handleChange("guardianName", e.target.value)}
                  placeholder="Enter guardian name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="guardianPhone" className="text-foreground">Phone No.</Label>
                <Input
                  id="guardianPhone"
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) => handleChange("guardianPhone", e.target.value)}
                  placeholder="+263..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-border">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Submit Application
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="border-border text-muted-foreground hover:bg-secondary"
            >
              Reset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdmissionFormModal;
