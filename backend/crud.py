from models import ScanHistory, User, Feedback


def save_feedback(
    db,
    username,
    rating,
    comment,
    date
):

    feedback = Feedback(

        username=username,

        rating=rating,

        comment=comment,

        date=date

    )

    db.add(feedback)

    db.commit()

    db.refresh(feedback)

    return feedback


def save_scan(
    db,
    website,
    score,
    risk,
    date,
    username,
    details=None
):

    user = get_user_by_username(
        db,
        username
    )

    scan = ScanHistory(

        website=website,

        score=score,

        risk=risk,

        date=date,

        user_id=user.id,

        details=details

    )

    db.add(scan)

    db.commit()

    db.refresh(scan)

    return scan



def get_history(
    db,
    username
):

    user = get_user_by_username(
        db,
        username
    )

    if not user:

        return []

    return db.query(

        ScanHistory

    ).filter(

        ScanHistory.user_id == user.id

    ).all()



def delete_history_item(
    db,
    scan_id,
    username
):

    user = get_user_by_username(
        db,
        username
    )

    if not user:

        return False

    scan = db.query(ScanHistory).filter(

        ScanHistory.id == scan_id,

        ScanHistory.user_id == user.id

    ).first()

    if not scan:

        return False

    db.delete(scan)

    db.commit()

    return True



def delete_all_history(
    db,
    username
):

    user = get_user_by_username(
        db,
        username
    )

    if not user:

        return 0

    deleted_count = db.query(

        ScanHistory

    ).filter(

        ScanHistory.user_id == user.id

    ).delete()

    db.commit()

    return deleted_count



def create_user(
    db,
    username,
    email,
    password
):

    user = User(

        username=username,

        email=email,

        password=password

    )


    db.add(user)

    db.commit()

    db.refresh(user)


    return user



def update_user_profile(
    db,
    current_username,
    new_username,
    new_email
):

    user = get_user_by_username(
        db,
        current_username
    )

    if not user:

        return None

    user.username = new_username

    user.email = new_email

    db.commit()

    db.refresh(user)

    return user



def update_user_password(
    db,
    username,
    new_hashed_password
):

    user = get_user_by_username(
        db,
        username
    )

    if not user:

        return None

    user.password = new_hashed_password

    db.commit()

    return user



def get_user_by_username(
    db,
    username
):

    return db.query(User).filter(

        User.username == username

    ).first()