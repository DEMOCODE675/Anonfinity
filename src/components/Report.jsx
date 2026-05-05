import { useState } from "react";
import { AlertTriangle, X, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useReports } from "../hooks/useReports";

const QUICK_REASONS = [
    "Spam",
    "Abusive",
    "Fake info",
    "Harassment",
    "Other",
];

function Report({ postId, onClose }) {
    const { loading, submitReport } = useReports();
    const [reason, setReason] = useState("");
    const [selected, setSelected] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalReason = selected || reason;

        try {
            await submitReport(postId, finalReason);
            toast.success("Report submitted 🚀");
            setTimeout(onClose, 800);
        } catch (err) {
            toast.error("Failed to submit report");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3">

            {/* MODAL */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl animate-in slide-in-from-bottom sm:zoom-in-95">

                {/* HEADER */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2 text-red-600 font-semibold">
                        <AlertTriangle size={18} />
                        Report
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* CONTENT */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    {/* QUICK OPTIONS */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                            Select reason
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {QUICK_REASONS.map((r) => (
                                <button
                                    type="button"
                                    key={r}
                                    onClick={() => setSelected(r)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition ${selected === r
                                            ? "bg-red-100 border-red-300 text-red-600"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TEXTAREA */}
                    <div>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setSelected("");
                                setReason(e.target.value.slice(0, 200));
                            }}
                            placeholder="Additional details (optional)"
                            className="w-full text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                            rows={3}
                        />
                        <p className="text-[10px] text-gray-400 text-right">
                            {reason.length}/200
                        </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 text-xs rounded-lg bg-gray-100 text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 text-xs rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Report;