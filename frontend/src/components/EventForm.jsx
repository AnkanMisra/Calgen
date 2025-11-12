import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EventForm = ({ onEventsCreated, onStatusUpdate }) => {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    count: 10,
    userInput: "",
    timezone: "America/New_York",
    earliestStartTime: 8, // Default 8 AM start time
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const exampleInputs = [
    "gym and fitness activities",
    "dental clinic and medical appointments",
    "study sessions and academic work",
    "software development and programming",
    "family gatherings and social events",
    "hobby projects and personal time",
  ];

  const timezones = [
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Kolkata",
    "Australia/Sydney",
  ];

  const handleInputChange = (e) => {
    e.preventDefault(); // Prevent any default behavior that might trigger form submission
    const { name, value, type } = e.target;

    console.log("Input changed:", { name, value, type }); // Debug log to see what's happening

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : parseInt(value, 10) || 1
          : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted!", e); // Debug log to see when form is submitted
    setLoading(true);
    setError("");

    // Validation
    if (!formData.startDate || !formData.endDate) {
      setError("Please select both start and end dates");
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    if (new Date(formData.startDate) < today) {
      setError("Start date cannot be before today");
      setLoading(false);
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError("Start date must be before end date");
      setLoading(false);
      return;
    }

    if (formData.count < 1 || formData.count > 10) {
      setError("Event count must be between 1 and 10");
      setLoading(false);
      return;
    }
    if (!formData.userInput.trim()) {
      setError("Please describe what type of events you want to create");
      setLoading(false);
      return;
    }

    try {
      onStatusUpdate(`Generating ${formData.count} event titles...`, "info");

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onStatusUpdate(`Successfully created ${data.total} events!`, "success");
        onEventsCreated(data.created);
        // Reset form
        setFormData({
          startDate: "",
          endDate: "",
          count: 10,
          userInput: "",
          timezone: "America/New_York",
          earliestStartTime: 8,
        });
      } else {
        setError(data.error || "Failed to create events");
        onStatusUpdate(`Error: ${data.error}`, "error");
      }
    } catch (err) {
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      onStatusUpdate(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Create Fake Events
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Range */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Date
            </label>
            <Input
              type="date"
              id="startDate"
              name="startDate"
              min={getTodayDateString()}
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Date
            </label>
            <Input
              type="date"
              id="endDate"
              name="endDate"
              min={getTodayDateString()}
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Start Time */}
          <div>
            <label
              htmlFor="earliestStartTime"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Preferred Start Time
            </label>
            <select
              id="earliestStartTime"
              name="earliestStartTime"
              value={formData.earliestStartTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={6}>6:00 AM</option>
              <option value={7}>7:00 AM</option>
              <option value={8}>8:00 AM</option>
              <option value={9}>9:00 AM</option>
              <option value={10}>10:00 AM</option>
              <option value={11}>11:00 AM</option>
              <option value={12}>12:00 PM</option>
              <option value={13}>1:00 PM</option>
              <option value={14}>2:00 PM</option>
              <option value={15}>3:00 PM</option>
              <option value={16}>4:00 PM</option>
              <option value={17}>5:00 PM</option>
              <option value={18}>6:00 PM</option>
              <option value={19}>7:00 PM</option>
              <option value={20}>8:00 PM</option>
            </select>
          </div>
        </div>
        {/* Date Helper */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            <span className="font-medium">📅 Note:</span> Events can only be
            created for today and future dates. Past dates are not allowed.
          </p>
        </div>
        {/* Start Time Helper */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-700">
            <span className="font-medium">⏰ Start Time:</span> Events will be
            scheduled from your selected start time until 1:00 AM. Events will
            be distributed across all selected days within this timeframe.
          </p>
        </div>
        {/* Event Count */}
        <div>
          <label
            htmlFor="count"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of Events
          </label>
          <Input
            type="number"
            id="count"
            name="count"
            min="1"
            max="30"
            value={formData.count || ""}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            placeholder="Enter number of events (1-10)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum 10 events per request
          </p>
        </div>
        "" ""
        {/* Event Type Description */}
        <div>
          <label
            htmlFor="userInput"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            What type of events do you want?
          </label>
          <Textarea
            id="userInput"
            name="userInput"
            value={formData.userInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            rows={3}
            placeholder="Describe what kind of events you want to create (e.g., 'gym workouts', 'study sessions', 'dental appointments', 'work meetings')..."
          />
          <div className="mt-2">
            <p className="text-xs text-gray-500">Examples:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {exampleInputs.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, userInput: example }))
                  }
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Timezone */}
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="px-6 py-3">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Events...
              </>
            ) : (
              "Create Fake Events"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
