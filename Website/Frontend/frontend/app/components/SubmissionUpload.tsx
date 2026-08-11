"use client";

import { useRef, useState } from "react";
import "./SubmissionUpload.css";

interface SubmissionUploadProps {
    onSuccess?: () => void;
}


export default function SubmissionUpload({
    onSuccess,
}: SubmissionUploadProps) {

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);

    const [subject, setSubject] = useState(
        "Computer Science"
    );

    const [assignmentTitle, setAssignmentTitle] =
        useState("");

    const [comments, setComments] = useState("");

    const [dragActive, setDragActive] =
        useState(false);

    const [uploading, setUploading] =
        useState(false);

    const [progress, setProgress] =
        useState(0);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
    ];

    const maxSize = 25 * 1024 * 1024;

    const validateFile = (selectedFile: File) => {

        setError("");
        setSuccess("");

        if (selectedFile.size > maxSize) {
            setError("File size cannot exceed 25 MB.");
            return false;
        }

        if (!allowedTypes.includes(selectedFile.type)) {
            setError(
                "Only PDF, DOC, DOCX, PPT, PPTX and ZIP files are allowed."
            );

            return false;
        }

        return true;
    };

    const selectFile = (selectedFile: File) => {

        if (!validateFile(selectedFile)) {
            return;
        }

        setFile(selectedFile);
        setError("");
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {

        const selectedFile =
            event.target.files?.[0];

        if (selectedFile) {
            selectFile(selectedFile);
        }
    };

    const handleDrop = (
        event: React.DragEvent<HTMLDivElement>
    ) => {

        event.preventDefault();

        setDragActive(false);

        const droppedFile =
            event.dataTransfer.files?.[0];

        if (droppedFile) {
            selectFile(droppedFile);
        }
    };

    const removeFile = () => {

        setFile(null);

        setProgress(0);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes: number) => {

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getFileExtension = () => {

        if (!file) return "";

        return file.name
            .split(".")
            .pop()
            ?.toUpperCase();
    };

    const submitAssignment = async () => {

        setError("");
        setSuccess("");

        if (!assignmentTitle.trim()) {
            setError(
                "Please enter the assignment title."
            );
            return;
        }

        if (!file) {
            setError(
                "Please select a file to upload."
            );
            return;
        }

        const token =
            localStorage.getItem("access_token");

        if (!token) {
            setError(
                "Your session has expired. Please login again."
            );
            return;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();

        formData.append(
            "subject",
            subject
        );

        formData.append(
            "assignment_title",
            assignmentTitle
        );

        formData.append(
            "file",
            file
        );

        formData.append(
            "comments",
            comments
        );

        try {

            const xhr = new XMLHttpRequest();

            xhr.open(
                "POST",
                "http://127.0.0.1:8000/api/submissions/create/"
            );

            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${token}`
            );

            xhr.upload.onprogress = (event) => {

                if (event.lengthComputable) {

                    const percentage =
                        Math.round(
                            (event.loaded / event.total) * 100
                        );

                    setProgress(percentage);
                }
            };

            xhr.onload = () => {

                setUploading(false);

                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    setProgress(100);

                    setSuccess(
                        "Assignment submitted successfully."
                    );

                    setFile(null);
                    setAssignmentTitle("");
                    setComments("");

                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }

                    if (onSuccess) {
                        onSuccess();
                    }

                } else {

                    try {

                        const response =
                            JSON.parse(xhr.responseText);

                        if (xhr.status === 401) {
                            setError(
                                "Your session has expired. Please sign in again."
                            );
                        } else {
                            setError(
                                response.errors?.file?.[0] ||
                                response.message ||
                                response.detail ||
                                "Upload failed."
                            );
                        }

                    } catch {

                        setError(
                            "Upload failed. Please try again."
                        );
                    }
                }

            };

            xhr.onerror = () => {

                setUploading(false);

                setError(
                    "Unable to connect to the server."
                );
            };

            xhr.send(formData);

        } catch {

            setUploading(false);

            setError(
                "Something went wrong."
            );
        }
    };

    return (
        <div className="submission-card">

            <div className="submission-header">

                <div>
                    <h2>
                        Submit New Assignment / Report
                    </h2>

                    <p>
                        Upload your assignment or project report
                        for evaluation.
                    </p>
                </div>

            </div>

            <div className="submission-form">

                <div className="form-row">

                    <div className="form-group">

                        <label>
                            Subject / Course
                        </label>

                        <select
                            value={subject}
                            onChange={(e) =>
                                setSubject(e.target.value)
                            }
                        >
                            <option>
                                Computer Science
                            </option>

                            <option>
                                Operating Systems
                            </option>

                            <option>
                                Computer Networks
                            </option>

                            <option>
                                Database Management Systems
                            </option>

                            <option>
                                Cyber Security
                            </option>
                        </select>

                    </div>


                    <div className="form-group">

                        <label>
                            Assignment Title
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Lab Report 4"
                            value={assignmentTitle}
                            onChange={(e) =>
                                setAssignmentTitle(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>


                <div className="form-group">

                    <label>
                        Upload File
                        <span className="file-hint">
                            {" "}
                            (PDF, DOC, DOCX, PPT, ZIP · Max 25MB)
                        </span>
                    </label>


                    {!file ? (

                        <div
                            className={`drop-zone ${dragActive
                                    ? "drag-active"
                                    : ""
                                }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragActive(true);
                            }}
                            onDragLeave={() =>
                                setDragActive(false)
                            }
                            onDrop={handleDrop}
                        >

                            <div className="upload-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>

                            <div className="drop-title">
                                Drag and drop your file here
                            </div>

                            <div className="drop-or">
                                or
                            </div>

                            <button
                                type="button"
                                className="choose-file-button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L2 19.5H22L12 2Z" fill="#0066DA"/>
                                    <path d="M2 19.5L7 11H22L17 19.5H2Z" fill="#00AC47"/>
                                    <path d="M7 11L12 2L17 11H7Z" fill="#EA4335"/>
                                </svg>

                                Choose File
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                onChange={handleFileChange}
                            />

                        </div>

                    ) : (

                        <div className="selected-file">

                            <div className="file-type-icon">
                                {getFileExtension() === "PDF"
                                    ? "PDF"
                                    : getFileExtension() || "FILE"}
                            </div>


                            <div className="file-details">

                                <div className="file-top">

                                    <span className="file-name">
                                        {file.name}
                                    </span>

                                    <button
                                        type="button"
                                        className="remove-file"
                                        onClick={removeFile}
                                        disabled={uploading}
                                        title="Remove File"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>

                                </div>


                                <div className="file-size">
                                    {formatFileSize(file.size)}
                                </div>


                                <div className="progress-container">

                                    <div
                                        className="progress-bar"
                                        style={{
                                            width: `${progress}%`,
                                        }}
                                    />

                                </div>


                                <div className="file-status">

                                    <span>
                                        {uploading
                                            ? `Uploading ${progress}%`
                                            : progress === 100
                                                ? "Upload complete"
                                                : "Ready to upload"}
                                    </span>

                                    {progress === 100 && (
                                        <span className="success-check">
                                            ✓
                                        </span>
                                    )}

                                </div>

                            </div>

                        </div>
                    )}

                </div>


                <div className="form-group">

                    <label>
                        Additional Comments / Notes
                    </label>

                    <textarea
                        placeholder="Add any instructions for your professor..."
                        value={comments}
                        onChange={(e) =>
                            setComments(e.target.value)
                        }
                    />

                </div>


                {error && (
                    <div className="upload-error">
                        {error}
                    </div>
                )}


                {success && (
                    <div className="upload-success">
                        ✓ {success}
                    </div>
                )}


                <button
                    type="button"
                    className="submit-button"
                    onClick={submitAssignment}
                    disabled={uploading}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>

                    {uploading
                        ? `Uploading ${progress}%...`
                        : "Submit Assignment"}

                </button>


            </div>

        </div>
    );
}