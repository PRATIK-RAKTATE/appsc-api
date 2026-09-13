import { Subject } from "../models/subject.model.js";

export const createSubject = async (data) => {
    return await Subject.create(data);
};

export const getSubjects = async () => {
    return await Subject.find().sort({ createdAt: -1 });
};

export const getSubjectById = async (id) => {
    const subject = await Subject.findById(id);

    if (!subject) {
        throw new Error("Subject not found");   
    }
    return subject;
};

export const updateSubject = async (id, data) => {
    const subject = await Subject.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true,
        },
    );

    if (!subject) {
        throw new Error("Subject not found");
    }

    return subject;
};

export const deleteSubject = async (id) => {
    const subject = await Subject.findByIdAndUpdate(
        id,
        { isActive: false },
        {
            new: true,
            runValidators: true
        }
    );

    if (!subject) {
        throw new Error("Subject not found");
    };

    return subject;
};