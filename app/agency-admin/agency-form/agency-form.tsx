"use client";
import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm, SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agencyFormSchemaBase, type AgencyFormValues } from "@/lib/agency";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useColorIntegration } from '@/hooks/useColorIntegration'


// Add type for agency type options
type AgencyType =
    | "PRIVATE_LIMITED"
    | "PROPRIETORSHIP"
    | "PARTNERSHIP";

// Add type for PAN type options
type PanType = "INDIVIDUAL" | "COMPANY" | "TRUST" | "OTHER";

export default function AgencyForm() {
    const router = useRouter();
    const {  updateColor } = useColorIntegration({
        onColorChange: (color) => {
            // This will be called when color is updated
            console.log('Color updated in agency form:', color)
        }
    })
    const [color, setColor] = useState("#4ECDC4");
    const [tempColor, setTempColor] = useState("#4ECDC4");
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [logoLoading, setLogoLoading] = useState(false);
    const [licenseLoading, setLicenseLoading] = useState(false);
    const [logoUploaded, setLogoUploaded] = useState(false);
    const [licenseUploaded, setLicenseUploaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors,  },
    } = useForm<AgencyFormValues>({
        resolver: zodResolver(agencyFormSchemaBase) as unknown as Resolver<AgencyFormValues, object>,
        mode: "onChange",
        defaultValues: {
            name: "",
            phoneCountryCode: "+91",
            companyPhoneCode: "+91",
            landingPageColor: "#4ECDC4",
            country: "INDIA",
            gstRegistered: true,
        },
    });

    const gstRegistered = watch("gstRegistered");

    const validateFile = (file: File, maxSize: number = 3 * 1024 * 1024): boolean => {
        if (file.size > maxSize) {
            toast.error("File size exceeds 3MB limit");
            return false;
        }
        return true;
    };

    const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.target.files?.[0] || null;
        if (file) {
            if (validateFile(file)) {
                setLogoLoading(true);
                setLogoUploaded(false);

                // Simulate upload delay
                setTimeout(async () => {
                    setLogoFile(file);
                    setValue("logo", file, { shouldValidate: true });
                    await trigger("logo");
                    setLogoLoading(false);
                    setLogoUploaded(true);
                }, 1000);
            }
        }
    };



    const handleLicenseUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.target.files?.[0] || null;
        if (file) {
            if (validateFile(file)) {
                setLicenseLoading(true);
                setLicenseUploaded(false);

                // Simulate upload delay
                setTimeout(async () => {
                    setLicenseFile(file);
                    setValue("businessLicense", file, { shouldValidate: true });
                    await trigger("businessLicense");
                    setLicenseLoading(false);
                    setLicenseUploaded(true);
                }, 1000);
            }
        }
    };

    const onSubmit: SubmitHandler<AgencyFormValues> = async (data) => {

        console.log('Form submission started');
        console.log('Form data:', data);
        console.log('Form errors:', errors);

        // Prevent double submission
        if (isSubmitting) {
            console.log('Already submitting, ignoring');
            return;
        }

        setIsSubmitting(true);

        try {
            // Validate files are selected
            if (!logoFile) {
                toast.error("Please upload a logo");
                return;
            }

            if (!licenseFile) {
                toast.error("Please upload a business license");
                return;
            }

            // Create FormData object
            const formData = new FormData();

            // Add all form fields to FormData
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'boolean') {
                        formData.append(key, String(value));
                        console.log(`Adding boolean field: ${key}=${value}`);
                    }
                    else if (value instanceof File) {
                        // Files are handled separately below
                        console.log(`Skipping file field in data: ${key}`);
                    }
                    else {
                        formData.append(key, String(value));
                        console.log(`Adding field: ${key}=${value}`);
                    }
                }
            });
            await updateColor(data.landingPageColor || "#4ECDC4");

            // Add files explicitly
            formData.append('logo', logoFile);
            formData.append('businessLicense', licenseFile);

            console.log("Sending form data to API...");

            const apiUrl = "/api/agencyform";
            console.log(`Making POST request to: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
            });

            console.log(`Response status: ${response.status} ${response.statusText}`);

            let responseData;
            try {
                responseData = await response.json();
            } catch {
                responseData = { error: "Invalid response from server" };
            }

            console.log('API Response:', responseData);

            if (!response.ok) {
                console.error("API error response:", responseData);
                throw new Error(
                    responseData.details ||
                    responseData.error ||
                    responseData.message ||
                    `Failed to submit form: ${response.status} ${response.statusText}`
                );
            }

            console.log("API success response:", responseData);
            toast.success("Agency created successfully!");

            setTimeout(() => {
                console.log("Redirecting to profile page...");
                router.push("/agency-admin/dashboard/profile");
            }, 1500);

        } catch (error: unknown) {
            console.error('Submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false); // FIXED: This was set to true before
        }
    };

    // Add debug function to test button click
    const handleButtonClick = () => {
        console.log('Button clicked!');
        console.log('Is submitting:', isSubmitting);
        console.log('Form errors:', errors);
        console.log('Logo file:', logoFile);
        console.log('License file:', licenseFile);
    };

    return (
        <div className="relative w-full overflow-hidden py-6 px-4 sm:px-6 lg:px-8 bg-custom-green z-[10] min-h-screen bg-custom-green flex items-center justify-center p-4 h-auto">
            {/* Logo positioned absolutely on the left */}
            <div className="absolute top-6 left-6 z-20">
                <Image
                    src="/logo/elneeraw.png"
                    alt="Company Logo"
                    width={100}
                    height={40}
                    className="w-[180px] h-auto"
                />
            </div>

            {/* Background Image */}
            <div className="absolute inset-0 -z-[10]">
                <Image
                    src="/background/Other details  -bg2.png"
                    alt=""
                    fill
                    className="object-cover opacity-100"
                    priority
                />
            </div>

            <div className="relative w-full max-w-4xl mt-20 mb-6">
                <div className="bg-white rounded-lg shadow-xl overflow-y-auto">
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="p-6 md:p-8">
                            <h1 className="text-4xl lg:text-4xl font-normal text-center mb-8 font-nunito">
                                Tell Us About Your Business
                            </h1>

                            <div className="space-y-8">
                                {/* Basic Informations Section */}
                                <div>
                                    <h2 className="text-2xl mb-6 text-greyish font-poppins">
                                        Basic Informations
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="company-name" className="font-poppins">
                                                Company Name*
                                            </Label>
                                            <Input
                                                id="company-name"
                                                placeholder="Company Name"
                                                className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                {...register("name")}
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.name.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="contact-person" className="font-poppins">
                                                Primary contact person*
                                            </Label>
                                            <Input
                                                id="contact-person"
                                                placeholder="John Smith"
                                                className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                {...register("contactPerson")}
                                            />
                                            {errors.contactPerson && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.contactPerson.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="agency-type" className="font-poppins">
                                                Agency type*
                                            </Label>
                                            <Select
                                                onValueChange={(value) =>
                                                    setValue("agencyType", value as AgencyType, { shouldValidate: true })
                                                }
                                            >
                                                <SelectTrigger
                                                    id="agency-type"
                                                    className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white font-poppins"
                                                >
                                                    <SelectValue placeholder="Select agency type" />
                                                </SelectTrigger>
                                                <SelectContent className="font-poppins">
                                                    <SelectItem value="PRIVATE_LIMITED">
                                                        Private Limited
                                                    </SelectItem>
                                                    <SelectItem value="PROPRIETORSHIP">
                                                        Proprietorship
                                                    </SelectItem>
                                                    <SelectItem value="PARTNERSHIP">
                                                        Partnership
                                                    </SelectItem>
                                                    <SelectItem value="PUBLIC_LIMITED">
                                                        Public Limited Companies
                                                    </SelectItem>
                                                    <SelectItem value="LLP">
                                                        Limited Liability Partnership
                                                    </SelectItem>
                                                    <SelectItem value="TOUR_OPERATOR">
                                                        Tour Operator
                                                    </SelectItem>
                                                    <SelectItem value="TRAVEL_AGENT">
                                                        Travel Agent
                                                    </SelectItem>
                                                    <SelectItem value="DMC">
                                                        DMC
                                                    </SelectItem>
                                                    <SelectItem value="OTHER">
                                                        Other
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.agencyType && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.agencyType.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="designation" className="font-poppins">
                                                Designation*
                                            </Label>
                                            <Input
                                                id="designation"
                                                placeholder="Designation"
                                                className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                {...register("designation")}
                                            />
                                            {errors.designation && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.designation.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="phone" className="font-poppins">
                                                Phone number*
                                            </Label>
                                            <div className="flex">
                                                <Select
                                                    defaultValue="+91"
                                                    onValueChange={(value) =>
                                                        setValue("phoneCountryCode", value, { shouldValidate: true })
                                                    }
                                                >
                                                    <SelectTrigger className="w-20 h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white">
                                                        <SelectValue placeholder="+91" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="+91">+91</SelectItem>
                                                        <SelectItem value="+1">+1</SelectItem>
                                                        <SelectItem value="+44">+44</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    id="phone"
                                                    placeholder="Enter phone number"
                                                    className="flex-1 ml-2 h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                    {...register("phoneNumber")}
                                                />
                                            </div>
                                            {errors.phoneNumber && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.phoneNumber.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-greyish text-2xl mb-6 font-poppins">
                                        Company Details
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="owner-name">Owner name*</Label>
                                            <Input
                                                id="owner-name"
                                                placeholder="Johan Smith"
                                                className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                {...register("ownerName")}
                                            />
                                            {errors.ownerName && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.ownerName.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="font-poppins">
                                                Email*
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="ex: email@domain.com"
                                                className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                {...register("email")}
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.email.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="company-phone" className="font-poppins">
                                                Phone number*
                                            </Label>
                                            <div className="flex">
                                                <Select
                                                    defaultValue="+91"
                                                    onValueChange={(value) =>
                                                        setValue("companyPhoneCode", value, { shouldValidate: true })
                                                    }
                                                >
                                                    <SelectTrigger className="w-20 h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white">
                                                        <SelectValue placeholder="+91" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="+91">+91</SelectItem>
                                                        <SelectItem value="+1">+1</SelectItem>
                                                        <SelectItem value="+44">+44</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    id="company-phone"
                                                    placeholder="Enter phone number"
                                                    className="flex-1 ml-2 h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                    {...register("companyPhone")}
                                                />
                                            </div>
                                            {errors.companyPhone && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.companyPhone.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="website" className="font-poppins">
                                                Website*
                                            </Label>
                                            <Input
                                                id="website"
                                                placeholder="Website URL"
                                                className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                {...register("website")}
                                            />
                                            {errors.website && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.website.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="logo" className="font-poppins">
                                                Logo*
                                            </Label>
                                            <div className="mt-1 flex items-center relative">
                                                <div className="bg-white rounded-l-md border border-gray-300 border-r-0 flex-grow h-12 flex items-center px-3 text-sm">
                                                    {logoFile
                                                        ? `${logoFile.name.substring(0, 15)}${logoFile.name.length > 15 ? "..." : ""}`
                                                        : "No file selected"}
                                                </div>
                                                <div className="flex">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const input = document.getElementById(
                                                                "logo-upload"
                                                            ) as HTMLInputElement;
                                                            if (input && !logoLoading) {
                                                                input.value = "";
                                                                input.click();
                                                            }
                                                        }}
                                                        className="h-12 rounded-l-none bg-greenlight hover:bg-greenlight text-white border border-emerald-500 focus:ring-0 font-poppins"
                                                        type="button"
                                                        disabled={logoLoading}
                                                    >
                                                        {logoLoading ? "Uploading..." : "Upload"}
                                                    </Button>
                                                    <input
                                                        id="logo-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleLogoUpload}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            {logoLoading && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Uploading file...
                                                </p>
                                            )}
                                            {logoUploaded && !logoLoading && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    File uploaded successfully!
                                                </p>
                                            )}
                                            {typeof errors.logo?.message === "string" && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.logo.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                File size should be under 3MB
                                            </p>
                                        </div>
                                        <div>
                                            <div>
                                                <Label>Landing page skin</Label>
                                                <div className="mt-1 relative">
                                                    <div
                                                        className="w-8 h-8 rounded cursor-pointer border"
                                                        style={{ backgroundColor: color }}
                                                        data-testid="color-picker-button"
                                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                                    />

                                                    {showColorPicker && (
                                                        <div
                                                            className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4"
                                                            onClick={(e) => {
                                                                if (e.target === e.currentTarget) {
                                                                    setShowColorPicker(false);
                                                                    setTempColor(color);
                                                                }
                                                            }}
                                                        >
                                                            <div
                                                                className="bg-white rounded-lg shadow-lg max-w-xs w-full p-4 z-50"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <h3 className="font-medium mb-3">
                                                                    Choose Landing Page Color
                                                                </h3>

                                                                <div
                                                                    className="w-full h-16 rounded mb-4"
                                                                    style={{ backgroundColor: tempColor }}
                                                                />

                                                                <div className="mb-4">
                                                                    <HexColorPicker
                                                                        color={tempColor}
                                                                        onChange={setTempColor}
                                                                        className="w-full"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <div className="text-sm w-10">RGB</div>
                                                                    <Input
                                                                        value={tempColor}
                                                                        onChange={(e) =>
                                                                            setTempColor(e.target.value)
                                                                        }
                                                                        className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white text-xs"
                                                                    />
                                                                    <div className="text-xs">100%</div>
                                                                </div>

                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setShowColorPicker(false);
                                                                            setTempColor(color);
                                                                        }}
                                                                        className="h-10 border border-gray-300 focus:ring-0 font-poppins"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setColor(tempColor);
                                                                            setValue("landingPageColor", tempColor, { shouldValidate: true });
                                                                            setShowColorPicker(false);
                                                                        }}
                                                                        className="bg-greenook hover:bg-bg-greenook h-10 focus:ring-0 font-poppins"
                                                                    >
                                                                        Apply
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 font-poppins">
                                    <div>
                                        <Label>GST Registration*</Label>
                                        <RadioGroup
                                            value={gstRegistered ? "yes" : "no"}
                                            className="flex gap-4 mt-1"
                                            onValueChange={(value) => {
                                                const isGstRegistered = value === "yes";
                                                setValue("gstRegistered", isGstRegistered, { shouldValidate: true });
                                                if (!isGstRegistered) {
                                                    setValue("gstNumber", undefined);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center space-x-2 h-12">
                                                <RadioGroupItem
                                                    value="yes"
                                                    id="gst-yes"
                                                    className="focus:ring-0"
                                                />
                                                <Label htmlFor="gst-yes">Yes</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 h-12">
                                                <RadioGroupItem
                                                    value="no"
                                                    id="gst-no"
                                                    className="focus:ring-0"
                                                />
                                                <Label htmlFor="gst-no">No</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                {gstRegistered && (
                                    <div className="grid md:grid-cols-2 gap-4 font-poppins">
                                        <div>
                                            <Label htmlFor="gst-no">GST No.*</Label>
                                            <Input
                                                id="gst-no"
                                                placeholder="GST Number"
                                                className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                                {...register("gstNumber")}
                                            />
                                            {errors.gstNumber && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.gstNumber.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4 font-poppins">
                                    <div>
                                        <Label htmlFor="year-reg">Year of Registration *</Label>
                                        <Input
                                            id="year-reg"
                                            placeholder="Year of Registration"
                                            className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white"
                                            {...register("yearOfRegistration")}
                                        />
                                        {errors.yearOfRegistration && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.yearOfRegistration.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="pan-no">PAN No.*</Label>
                                        <Input
                                            id="pan-no"
                                            placeholder="PAN Number"
                                            className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white font-poppins"
                                            {...register("panNumber")}
                                        />
                                        {errors.panNumber && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.panNumber.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="pan-type">PAN Type*</Label>
                                        <Select
                                            onValueChange={(value) =>
                                                setValue("panType", value as PanType, { shouldValidate: true })
                                            }
                                        >
                                            <SelectTrigger className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white font-poppins">
                                                <SelectValue placeholder="Select PAN type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                                <SelectItem value="COMPANY">Company</SelectItem>
                                                <SelectItem value="TRUST">Trust</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.panType && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.panType.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="headquarters">Headquarters*</Label>
                                        <Input
                                            id="headquarters"
                                            placeholder="Address"
                                            className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white font-poppins"
                                            {...register("headquarters")}
                                        />
                                        {errors.headquarters && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.headquarters.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="country">Country*</Label>
                                        <Select
                                            onValueChange={(value) => setValue("country", value, { shouldValidate: true })}
                                            defaultValue="INDIA"
                                        >
                                            <SelectTrigger className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white font-poppins">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INDIA">INDIA</SelectItem>
                                                <SelectItem value="USA">USA</SelectItem>
                                                <SelectItem value="UK">UK</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="years-operation">Years of operation*</Label>
                                        <Input
                                            id="years-operation"
                                            placeholder="Years of operation"
                                            className="h-12 border border-gray-300 focus:border-gray-400 focus:ring-0 focus:bg-white font-poppins"
                                            {...register("yearsOfOperation")}
                                        />
                                        {errors.yearsOfOperation && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.yearsOfOperation.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="license">
                                            Business License / Registration Certificate*
                                        </Label>
                                        <div className="mt-1 flex items-center relative">
                                            <div className="bg-white rounded-l-md border border-gray-300 border-r-0 flex-grow h-12 flex items-center px-3 text-sm font-poppins">
                                                {licenseFile
                                                    ? `${licenseFile.name.substring(0, 15)}${licenseFile.name.length > 15 ? "..." : ""
                                                    }`
                                                    : "No file selected"}
                                            </div>
                                            <div className="flex">
                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const input = document.getElementById(
                                                            "license-upload"
                                                        ) as HTMLInputElement;
                                                        if (input && !licenseLoading) {
                                                            input.value = "";
                                                            input.click();
                                                        }
                                                    }}
                                                    className="h-12 rounded-l-none bg-greenlight hover:bg-greenlight text-white border border-emerald-500 focus:ring-0 font-poppins"
                                                    type="button"
                                                    disabled={licenseLoading}
                                                >
                                                    {licenseLoading ? "Uploading..." : "Upload"}
                                                </Button>
                                                <input
                                                    id="license-upload"
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,image/*"
                                                    className="hidden"
                                                    onChange={handleLicenseUpload}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                        {licenseLoading && (
                                            <p className="text-xs text-amber-600 mt-1">
                                                Uploading file...
                                            </p>
                                        )}
                                        {licenseUploaded && !licenseLoading && (
                                            <p className="text-xs text-green-600 mt-1">
                                                File uploaded successfully!
                                            </p>
                                        )}
                                        {typeof errors.businessLicense?.message === "string" && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.businessLicense.message}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            File size should be under 3MB
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        onClick={handleButtonClick}
                                        style={{ zIndex: 9999, position: 'relative' }}
                                        className="w-full sm:w-[356px] mx-auto rounded-full bg-red-500 px-4 py-3 h-12 font-medium text-white"
                                    >
                                        {isSubmitting ? "Submitting..." : "Let's get started"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}