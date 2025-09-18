"use client"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, AlertCircle } from "lucide-react"

interface AgencyCancellationPolicy {
  id: string
  policy_name: string
  cancellation_deadline_days: number
  cancellation_terms: string
  refund_percentage?: number
}

interface CancellationPolicySectionProps {
  cancellationPolicyType: string
  customCancellationDeadline: number
  customCancellationTerms: string
  agencyCancellationPolicy: AgencyCancellationPolicy | null
  onPolicyTypeChange: (type: string) => void
  onCustomDeadlineChange: (deadline: number) => void
  onCustomTermsChange: (terms: string) => void
}

export default function CancellationPolicySection({
  cancellationPolicyType,
  customCancellationDeadline,
  customCancellationTerms,
  agencyCancellationPolicy,
  onPolicyTypeChange,
  onCustomDeadlineChange,
  onCustomTermsChange,
}: CancellationPolicySectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold font-poppins text-black mb-4 block">Cancellation Policy</Label>

        <RadioGroup value={cancellationPolicyType} onValueChange={onPolicyTypeChange} className="space-y-4">
          {/* Default Agency Policy Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="default"
                id="policy-default"
                className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
              />
              <Label htmlFor="policy-default" className="text-sm font-medium">
                Use Default Agency Policy
              </Label>
            </div>

            {cancellationPolicyType === "default" && agencyCancellationPolicy && (
              <Card className="ml-7 border-emerald-200 bg-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-emerald-800">{agencyCancellationPolicy.policy_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-emerald-700">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Cancellation deadline: {agencyCancellationPolicy.cancellation_deadline_days} days before
                          travel
                        </span>
                      </div>
                      <p className="text-sm text-emerald-700">{agencyCancellationPolicy.cancellation_terms}</p>
                      {agencyCancellationPolicy.refund_percentage && (
                        <p className="text-sm font-medium text-emerald-800">
                          Refund: {agencyCancellationPolicy.refund_percentage}% of total amount
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Custom Policy Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="custom"
                id="policy-custom"
                className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
              />
              <Label htmlFor="policy-custom" className="text-sm font-medium">
                Custom Cancellation Policy
              </Label>
            </div>

            {cancellationPolicyType === "custom" && (
              <div className="ml-7 space-y-4">
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-800 mb-2">Custom Policy Configuration</h4>
                        <p className="text-sm text-orange-700">
                          Define your own cancellation terms and deadline for this specific itinerary.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Cancellation Deadline (days before travel) *
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={customCancellationDeadline || ""}
                      onChange={(e) => onCustomDeadlineChange(Number.parseInt(e.target.value) || 0)}
                      placeholder="Enter number of days"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of days before travel date when cancellation is allowed
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Custom Cancellation Terms *</Label>
                    <Textarea
                      value={customCancellationTerms}
                      onChange={(e) => onCustomTermsChange(e.target.value)}
                      placeholder="Enter detailed cancellation terms and conditions..."
                      className="min-h-[120px] resize-none"
                      rows={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Detailed terms including refund policy, charges, and conditions
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}