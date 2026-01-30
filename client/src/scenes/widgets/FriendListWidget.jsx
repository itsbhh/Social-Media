import { Box, Typography, useTheme } from "@mui/material";
import Friend from "../../components/Friend";
import WidgetWrapper from "../../components/WidgetWrapper";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "../../state";

const FriendListWidget = ({ userId }) => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user?.friends || []); // Ensure friends is an array

  const getFriends = async () => {
    try {
      const response = await fetch(
        `https://social-media-uupi.onrender.com/users/${userId}/friends`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      dispatch(setFriends({ friends: data })); // Dispatch friends list
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      getFriends();
    }
  }, [userId]); // Fetch friends when the userId changes

  return (
    <WidgetWrapper>
      <Typography
        color={palette.neutral.dark}
        variant="h5"
        fontWeight="500"
        sx={{ mb: "1.5rem" }}
      >
        Friend List
      </Typography>
      <Box display="flex" flexDirection="column" gap="1.5rem">
        {Array.isArray(friends) && friends.length > 0 ? (
          friends.map((friend) => (
            <Friend
              key={friend._id}
              friendId={friend._id}
              name={`${friend.firstName} ${friend.lastName}`}
              subtitle={friend.occupation}
              userPicturePath={friend.picturePath}
            />
          ))
        ) : (
          <Typography>No friends found.</Typography> // Fallback when no friends
        )}
      </Box>
    </WidgetWrapper>
  );
};

export default FriendListWidget;
