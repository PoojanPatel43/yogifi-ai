package com.yogifi.config;

import com.yogifi.model.Pose;
import com.yogifi.repository.PoseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final PoseRepository poseRepository;

    @Override
    public void run(String... args) {
        if (poseRepository.count() == 0) {
            log.info("Loading initial pose data...");
            loadPoses();
            log.info("Initial data loaded successfully!");
        } else {
            log.info("Poses already exist, skipping data load.");
        }
    }

    private void loadPoses() {
        List<Pose> poses = List.of(
            // Beginner Poses
            Pose.builder()
                .name("Mountain Pose")
                .sanskritName("Tadasana")
                .difficulty(Pose.Difficulty.BEGINNER)
                .description("The foundation of all standing poses. Improves posture and body awareness.")
                .instructions("1. Stand with feet together, arms at sides\n2. Distribute weight evenly on both feet\n3. Engage thigh muscles, lift kneecaps\n4. Lengthen tailbone toward floor\n5. Lift chest and roll shoulders back\n6. Arms hang naturally, palms facing forward\n7. Gaze straight ahead, chin parallel to floor")
                .benefits("Improves posture, strengthens thighs, knees and ankles, firms abdomen and buttocks, relieves sciatica")
                .precautions("If you have headache or insomnia, practice with back against wall")
                .targetDurationSeconds(30)
                .build(),

            Pose.builder()
                .name("Warrior II")
                .sanskritName("Virabhadrasana II")
                .difficulty(Pose.Difficulty.BEGINNER)
                .description("A powerful standing pose that builds strength and stamina while opening the hips and chest.")
                .instructions("1. Stand with feet 3-4 feet apart\n2. Turn right foot out 90 degrees, left foot slightly in\n3. Raise arms parallel to floor, palms down\n4. Bend right knee over right ankle\n5. Keep torso upright, shoulders over hips\n6. Turn head to gaze over right fingertips\n7. Hold, then repeat on other side")
                .benefits("Strengthens and stretches legs and ankles, stretches groins, chest and shoulders, stimulates abdominal organs, increases stamina")
                .precautions("If you have high blood pressure or neck problems, don't turn head to look over front hand; look straight ahead instead")
                .targetDurationSeconds(30)
                .build(),

            Pose.builder()
                .name("Downward-Facing Dog")
                .sanskritName("Adho Mukha Svanasana")
                .difficulty(Pose.Difficulty.BEGINNER)
                .description("One of the most recognized yoga poses. It stretches and strengthens the entire body.")
                .instructions("1. Start on hands and knees\n2. Spread fingers wide, press into palms\n3. Tuck toes and lift knees off floor\n4. Straighten legs, lift hips up and back\n5. Create inverted V shape with body\n6. Press heels toward floor\n7. Relax head between upper arms")
                .benefits("Calms the brain and helps relieve stress, energizes the body, stretches shoulders, hamstrings, calves, arches, and hands, strengthens arms and legs")
                .precautions("Avoid if you have carpal tunnel syndrome, are in late-term pregnancy, or have high blood pressure")
                .targetDurationSeconds(45)
                .build(),

            Pose.builder()
                .name("Tree Pose")
                .sanskritName("Vrksasana")
                .difficulty(Pose.Difficulty.BEGINNER)
                .description("A balancing pose that promotes focus and concentration while strengthening the legs.")
                .instructions("1. Stand on left leg\n2. Place right foot on inner left thigh or calf (avoid knee)\n3. Press foot and leg into each other\n4. Bring palms together at heart center\n5. Fix gaze on a point for balance\n6. Optionally raise arms overhead\n7. Hold, then switch sides")
                .benefits("Strengthens thighs, calves, ankles, and spine, stretches the groins and inner thighs, improves sense of balance")
                .precautions("If you have headache, insomnia, or low blood pressure, don't raise arms overhead")
                .targetDurationSeconds(30)
                .build(),

            // Intermediate Poses
            Pose.builder()
                .name("Triangle Pose")
                .sanskritName("Trikonasana")
                .difficulty(Pose.Difficulty.INTERMEDIATE)
                .description("A standing pose that stretches and strengthens the legs while opening the chest and shoulders.")
                .instructions("1. Stand with feet 3-4 feet apart\n2. Turn right foot out 90 degrees, left foot in 45 degrees\n3. Extend arms parallel to floor\n4. Reach right hand toward right foot\n5. Extend left arm toward ceiling\n6. Keep both sides of torso equally long\n7. Turn head to gaze at left thumb")
                .benefits("Stretches and strengthens thighs, knees, and ankles, stretches hips, groins, hamstrings, calves, shoulders, chest, and spine, stimulates abdominal organs")
                .precautions("If you have a neck injury, don't turn head to look upward; continue looking straight ahead")
                .targetDurationSeconds(30)
                .build(),

            Pose.builder()
                .name("Warrior III")
                .sanskritName("Virabhadrasana III")
                .difficulty(Pose.Difficulty.INTERMEDIATE)
                .description("A challenging balance pose that strengthens the entire back side of the body.")
                .instructions("1. From standing, shift weight to right leg\n2. Hinge forward from hips\n3. Extend left leg back, parallel to floor\n4. Reach arms forward or alongside body\n5. Keep hips level and squared forward\n6. Body forms a T shape\n7. Hold, then repeat on other side")
                .benefits("Strengthens ankles and legs, strengthens shoulders and back muscles, tones the abdomen, improves balance and posture")
                .precautions("Avoid if you have high blood pressure. Use wall for support if balance is challenging")
                .targetDurationSeconds(20)
                .build(),

            Pose.builder()
                .name("Half Moon Pose")
                .sanskritName("Ardha Chandrasana")
                .difficulty(Pose.Difficulty.INTERMEDIATE)
                .description("A balancing pose that improves coordination and sense of balance while strengthening the legs.")
                .instructions("1. From Triangle Pose on right side\n2. Bend right knee, shift weight forward\n3. Place right hand on floor ahead of foot\n4. Lift left leg parallel to floor\n5. Open left hip, stacking over right\n6. Extend left arm toward ceiling\n7. Turn head to gaze at left hand")
                .benefits("Strengthens abdomen, ankles, thighs, buttocks, and spine, stretches groins, hamstrings, calves, shoulders, chest, and spine, improves coordination and balance")
                .precautions("If you have headache, migraine, low blood pressure, or diarrhea, avoid this pose")
                .targetDurationSeconds(20)
                .build(),

            // Advanced Poses
            Pose.builder()
                .name("Crow Pose")
                .sanskritName("Bakasana")
                .difficulty(Pose.Difficulty.ADVANCED)
                .description("An arm balance that builds strength and concentration. It's often the first arm balance yogis learn.")
                .instructions("1. Squat with feet together\n2. Place hands on floor, shoulder-width apart\n3. Spread fingers wide, bend elbows slightly\n4. Place knees on backs of upper arms\n5. Shift weight forward onto hands\n6. Lift feet off floor one at a time\n7. Draw heels toward buttocks")
                .benefits("Strengthens arms and wrists, stretches the upper back, strengthens abdominal muscles, opens the groins, tones abdominal organs")
                .precautions("Avoid if you have carpal tunnel syndrome or are pregnant. Place a folded blanket in front of you for confidence")
                .targetDurationSeconds(15)
                .build(),

            Pose.builder()
                .name("Wheel Pose")
                .sanskritName("Urdhva Dhanurasana")
                .difficulty(Pose.Difficulty.ADVANCED)
                .description("A deep backbend that opens the chest and stretches the entire front body while strengthening the back.")
                .instructions("1. Lie on back, bend knees, feet on floor\n2. Place hands beside ears, fingers pointing toward shoulders\n3. Press into hands and feet\n4. Lift hips and torso off floor\n5. Straighten arms, lifting head off floor\n6. Press chest toward wall behind you\n7. Hold, then slowly lower down")
                .benefits("Stretches chest and lungs, strengthens arms, wrists, legs, buttocks, abdomen, and spine, stimulates thyroid and pituitary, increases energy")
                .precautions("Avoid if you have back injury, carpal tunnel syndrome, headache, heart problems, high or low blood pressure")
                .targetDurationSeconds(15)
                .build(),

            Pose.builder()
                .name("Headstand")
                .sanskritName("Sirsasana")
                .difficulty(Pose.Difficulty.ADVANCED)
                .description("Known as the 'king of asanas,' this inversion offers numerous benefits and requires strength and balance.")
                .instructions("1. Kneel on floor, interlace fingers\n2. Place forearms on floor, elbows shoulder-width\n3. Place crown of head on floor, cradled by hands\n4. Lift knees off floor, walk feet in\n5. Lift legs up one at a time or together\n6. Stack hips over shoulders over head\n7. Engage core, point toes toward ceiling")
                .benefits("Calms the brain and helps relieve stress, strengthens arms, legs, and spine, strengthens lungs, tones abdominal organs, improves digestion")
                .precautions("Avoid if you have back injury, headache, heart condition, high blood pressure, menstruation, neck injury, or low blood pressure")
                .targetDurationSeconds(30)
                .build()
        );

        poseRepository.saveAll(poses);
        log.info("Loaded {} poses", poses.size());
    }
}
