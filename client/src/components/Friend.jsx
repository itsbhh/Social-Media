// Friend.jsx (patched)
import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFriends } from "../state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";

const Friend = ({ friendId, name, subtitle, userPicturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // safe selectors: don't destructure from null/undefined
  const _id = useSelector((state) => state?.user?._id ?? state?.user?.id ?? null);
  const token = useSelector((state) => state?.token ?? null);

  // Default friends to an empty array to avoid errors
  const friends = useSelector((state) => Array.isArray(state?.user?.friends) ? state.user.friends : []);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  const isFriend = friends.some((friend) => friend._id === friendId);

  const patchFriend = async () => {
    if (!_id || !token) {
      console.warn("Missing current user id or token — cannot patch friend");
      return;
    }

    try {
      const response = await fetch(
        `https://social-media-uupi.onrender.com/users/${_id}/${friendId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        console.error("Patch friend failed", response.status);
        return;
      }
      const data = await response.json();
      // ensure payload is an array of friends; guard before dispatch
      if (Array.isArray(data)) {
        dispatch(setFriends({ friends: data }));
      } else if (data?.friends) {
        dispatch(setFriends({ friends: data.friends }));
      } else {
        console.warn("Unexpected response shape from PATCH /users/:id/:friendId", data);
      }
    } catch (error) {
      console.error("Error updating friend status:", error);
    }
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" />
        <Box
          onClick={() => {
            navigate(`/profile/${friendId}`);
            // don't force reload unless necessary
          }}
        >
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              "&:hover": {
                color: primaryLight,
                cursor: "pointer",
              },
            }}
          >
            {name}
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
      <IconButton
        onClick={patchFriend}
        sx={{ backgroundColor: primaryLight, p: "0.6rem" }}
      >
        {isFriend ? (
          <PersonRemoveOutlined sx={{ color: primaryDark }} />
        ) : (
          <PersonAddOutlined sx={{ color: primaryDark }} />
        )}
      </IconButton>
    </FlexBetween>
  );
};

export default Friend;
