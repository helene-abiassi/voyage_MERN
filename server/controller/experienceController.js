import { v2 as cloudinary } from "cloudinary";
import { commentModel } from "../models/commentModel.js";
import { experienceModel } from "../models/experienceModel.js";
import userModel from "../models/userModel.js";

const getAllExperiences = async (req, res) => {
  const { comments } = req.query;

  const allExperiences = await experienceModel.find().populate([
    {
      path: "bookmarked_by",
      select: ["username", "bio", "member_since", "user_image"],
    },
    { path: "comments" },
    {
      path: "author",
      select: ["username", "email", "bio", "member_since", "user_image"],
    },
  ]);
  // console.log("allExperiences :>> ", allExperiences);

  res.json({
    number: allExperiences.length,
    data: allExperiences,
  });
};

const getExperiencesById = async (req, res) => {
  const id = req.params._id;

  try {
    const experienceByID = await experienceModel.findById(id).populate([
      {
        path: "bookmarked_by",
        select: ["username", "bio", "member_since", "user_image"],
      },
      { path: "comments" },
      {
        path: "author",
        select: ["username", "email", "bio", "member_since", "user_image"],
      },
    ]);

    console.log("experienceByID :>> ", experienceByID);

    if (experienceByID) {
      res.status(200).json({
        number: 1,
        data: experienceByID,
      });
    } else {
      res.status(404).json({
        number: 0,
        errorMessage: "OH NO! No such id exists",
      });
    }
  } catch (error) {
    console.log("expType error :>> ", error);
    res.status(500).json({
      errorMessage: "Something went wrong in the request",
      error: error.message,
    });
  }
};

const getExperiencesByType = async (req, res) => {
  const { experienceType } = req.params;

  try {
    const experiences = await experienceModel.find({
      experienceType: experienceType,
    });

    if (experiences.length > 0) {
      res.status(200).json({
        number: experiences.length,
        data: experiences,
      });
    } else {
      res.status(200).json({
        number: experiences.length,
        errorMessage: "OH NO! No such type exists",
      });
    }
  } catch (error) {
    console.log("expType error :>> ", error);
    res.status(500).json({
      errorMessage: "something went wrong in the request",
      error,
    });
  }
};

const getExperiencesByCountry = async (req, res) => {
  const { country } = req.params;

  try {
    const experienceByCountry = await experienceModel.find({
      "location.country": country,
    });

    if (experienceByCountry.length > 0) {
      res.status(200).json({
        number: experienceByCountry.length,
        data: experienceByCountry,
      });
    } else {
      res.status(404).json({
        number: 0,
        errorMessage: "No experiences found for the specified country",
      });
    }
  } catch (error) {
    console.error("Error in getExperiencesByCountry:", error);
    res.status(500).json({
      errorMessage: "Internal server error",
      error: error.message, // Include the error message for debugging
    });
  }
};

const getExperiencesByCity = async (req, res) => {
  const { country, city } = req.params;
  console.log("city :>> ", city);

  try {
    const experienceByCity = await experienceModel.find({
      "location.city": city,
      "location.country": country,
    });
    // console.log("experienceByCity :>> ", experienceByCity);

    if (experienceByCity.length > 0) {
      res.status(200).json({
        number: experienceByCity.length,
        data: experienceByCity,
      });
    } else {
      res.status(200).json({
        number: experienceByCity.length,
        errorMessage: "OH NO! No such country/ city exists",
      });
    }
  } catch (error) {
    console.log("expType error :>> ", error);
    res.status(500).json({
      errorMessage: "something went wrong in the request",
      error,
    });
  }
};

const submitExperience = async (req, res) => {
  console.log("req.body :>> ", req.body);
  const photosArray = JSON.parse(req.body.photo_body);
  console.log("photosArray :>> ", photosArray);

  try {
    const existingUser = await userModel.findOne({ email: req.body.email });
    console.log("existingUser :>> ", existingUser);
    if (existingUser) {
      try {
        const newSubmission = new experienceModel({
          author: existingUser._id,
          title: req.body.title,
          caption: req.body.caption,
          photo: req.body.photo,
          location: {
            country: req.body.country,
            city: req.body.city,
            longitude: req.body.longitude,
            latitude: req.body.latitude,
          },
          experienceType: req.body.experienceType,
          text_body: req.body.text_body,
          photo_body: photosArray,
        });

        const savedSubmission = await newSubmission.save();

        console.log("savedSubmission :>> ", savedSubmission);
        res.status(201).json({
          message: "Experience posted successfully",
          submission: savedSubmission,
        });
      } catch (error) {
        console.log("error when trying to submit an experience: ", error);
        res.status(500).json({
          message: "Something went wrong when trying to post an experience",
        });
      }
    } else {
      res.status(401).json({
        message: "You need to be logged in to submit an experience",
      });
    }
  } catch (error) {
    console.log("Catch error: ", error);
    res.status(500).json({
      message: "Oh no! Something went wrong!",
    });
  }
};

const uploadPhoto = async (req, res) => {
  console.log(req.file);

  //Upload the file to cloudinary /if/ there is a file in req
  if (req.file) {
    try {
      // Upload the image
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "voyageApp/experienceMainPhotos",
      });
      console.log("uploadedImage", uploadedImage);
      res.status(200).json({
        message: "Image uploaded successfully",
        photo: uploadedImage.secure_url,
      });
      // Save the photo in the userphoto collection
    } catch (error) {
      console.error("error", error);
    }
  } else {
    res.status(500).json({
      error: "File type not supported",
    });
  }
};

const uploadMultiplePhotos = async (req, res) => {
  const photos = req.files;
  console.log("photos :>> ", photos);

  if (!photos || photos.length === 0) {
    res.status(400).json({ error: "No files were uploaded." });
  }

  try {
    const uploadedImages = await Promise.all(
      photos.map(async (photo) => {
        const uploadedImage = await cloudinary.uploader.upload(photo.path, {
          folder: "voyageApp/experiencePhotoAlbum",
        });
        return uploadedImage.secure_url;
      })
    );
    console.log("uploadedImages :>> ", uploadedImages);
    res.status(200).json({
      message: "Images uploaded successfully",
      photo_urls: uploadedImages,
    });
  } catch (error) {
    console.error("Error uploading images", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export {
  getAllExperiences,
  getExperiencesByType,
  getExperiencesById,
  getExperiencesByCountry,
  getExperiencesByCity,
  submitExperience,
  uploadPhoto,
  uploadMultiplePhotos,
  // getCommentsByExperienceId,
};
