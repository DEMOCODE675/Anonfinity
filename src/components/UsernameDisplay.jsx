import { useState, useEffect } from "react";
import { Edit2, Check, X, Wand2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
    generateUsernameOptions,
    checkUsernameAvailability,
} from "../utils/generateUsername";

function UsernameDisplay({ username, loading, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(username || "");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                newUsername.trim() &&
                newUsername !== username &&
                newUsername.length >= 3
            ) {
                checkAvailability(newUsername);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [newUsername]);

    const checkAvailability = async (name) => {
        setIsChecking(true);
        const ok = await checkUsernameAvailability(name);
        setStatus(ok ? "ok" : "taken");
        setIsChecking(false);
    };

    const handleSave = async () => {
        if (status === "taken") return;

        setIsSaving(true);
        const success = await onUpdate(newUsername);
        setIsSaving(false);

        if (success) {
            toast.success("Updated");
            setIsEditing(false);
        }
    };

    const generate = async () => {
        const data = await generateUsernameOptions(4);
        setSuggestions(data);
        setShowSuggestions(true);
    };

    if (loading) {
        return (
            <div className="animate-pulse h-10 w-32 bg-gray-200 rounded-full" />
        );
    }

    return (
        <div className="relative inline-block">

            {/* DISPLAY MODE */}
            {!isEditing && (
                <div
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 cursor-pointer hover:scale-105 transition-all"
                >
                    <span className="text-sm font-semibold text-gray-800">
                        @{username}
                    </span>
                    <Edit2 size={14} className="text-gray-500" />
                </div>
            )}

            {/* EDIT MODE */}
            {isEditing && (
                <div className="bg-white shadow-lg border rounded-xl p-3 w-64 space-y-2">

                    {/* INPUT */}
                    <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
                        <input
                            value={newUsername}
                            onChange={(e) =>
                                setNewUsername(
                                    e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20)
                                )
                            }
                            className="flex-1 outline-none text-sm"
                            placeholder="username"
                        />

                        {isChecking && <Loader2 size={14} className="animate-spin" />}

                        {status === "ok" && <Check size={14} className="text-green-500" />}
                        {status === "taken" && <X size={14} className="text-red-500" />}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={status === "taken" || isSaving}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>

                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* GENERATE */}
                    <button
                        onClick={generate}
                        className="w-full text-xs py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex justify-center gap-1"
                    >
                        <Wand2 size={14} />
                        Generate
                    </button>

                    {/* SUGGESTIONS */}
                    {showSuggestions && (
                        <div className="grid grid-cols-2 gap-1">
                            {suggestions.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setNewUsername(s);
                                        setStatus("ok");
                                    }}
                                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default UsernameDisplay;